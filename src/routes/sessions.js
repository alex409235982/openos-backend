import express from 'express';
import crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';
import Session from '../models/Session.js';
import Distro from '../models/Distro.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const execAsync = promisify(exec);

const VM_CONFIGS = {
  'Ubuntu': {
    novncUrl: 'https://caryl-unvizored-sherie.ngrok-free.dev',
    vmName: 'ubuntu-base',
    vmPort: 8080,
    username: 'openos',
    password: 'openos'
  },
  'Linux Mint': {
    novncUrl: 'https://linux-mint.ngrok.app',
    vmName: 'linux-mint',
    vmPort: 8081,
    username: 'openos',
    password: 'openos'
  }
};

const DEFAULT_VM = VM_CONFIGS['Ubuntu'];

let activeSessionLock = false;
let currentSessionUserId = null;
let currentVMName = 'ubuntu-base';
let resetInProgress = false;

async function resetVM(vmName) {
  resetInProgress = true;
  try {
    await execAsync(`virsh destroy ${vmName} 2>/dev/null || true`);
    await execAsync(`virsh snapshot-revert ${vmName} clean`);
    await execAsync(`virsh start ${vmName}`);
    await new Promise(resolve => setTimeout(resolve, 30000));
  } finally {
    resetInProgress = false;
  }
}

router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { distroId } = req.body;
    const userId = req.user._id.toString();

    if (resetInProgress) {
      return res.status(503).json({ error: 'VM is being reset. Please wait 30 seconds.' });
    }

    if (activeSessionLock && currentSessionUserId !== userId) {
      return res.status(409).json({ error: 'Another user is currently using the VM. Please wait until they finish.' });
    }

    const activeSession = await Session.findOne({ userId, status: 'running' });
    if (activeSession) {
      return res.status(400).json({ error: 'You already have an active session' });
    }

    const distro = await Distro.findById(distroId);
    if (!distro) {
      return res.status(404).json({ error: 'Distribution not found' });
    }

    const vmConfig = VM_CONFIGS[distro.name] || DEFAULT_VM;

    if (!activeSessionLock) {
      if (currentSessionUserId && currentSessionUserId !== userId) {
        await resetVM(currentVMName);
      }
      activeSessionLock = true;
      currentSessionUserId = userId;
      currentVMName = vmConfig.vmName;
    }

    const session = new Session({
      userId,
      distroId,
      distroName: distro.name,
      distroLogo: distro.logo,
      vmUsername: vmConfig.username,
      vmPassword: vmConfig.password,
      vmId: vmConfig.vmName,
      vmPort: vmConfig.vmPort,
      status: 'running'
    });

    await session.save();

    res.status(201).json({
      ...session.toJSON(),
      novncUrl: vmConfig.novncUrl,
      vmUsername: vmConfig.username,
      vmPassword: vmConfig.password,
      websocketUrl: `${vmConfig.novncUrl.replace('https', 'wss')}/websockify`
    });
  } catch (error) {
    next(error);
  }
});

router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const sessions = await Session.find({ userId: req.user._id }).sort({ createdAt: -1 });
    
    const sessionsWithStatus = await Promise.all(sessions.map(async (session) => {
      let elapsedTime = 0;
      if (session.status === 'running' && session.startedAt) {
        elapsedTime = Math.floor((Date.now() - new Date(session.startedAt)) / 1000);
        
        if (req.user.plan !== 'premium' && elapsedTime >= 1800) {
          session.status = 'expired';
          session.endedAt = new Date();
          session.duration = elapsedTime;
          await session.save();
          
          if (currentSessionUserId === req.user._id.toString()) {
            activeSessionLock = false;
            currentSessionUserId = null;
            resetVM(currentVMName).catch(console.error);
          }
        }
      }
      return {
        ...session.toJSON(),
        elapsedTime,
        vmUsername: undefined,
        vmPassword: undefined
      };
    }));
    
    res.json(sessionsWithStatus);
  } catch (error) {
    next(error);
  }
});

router.post('/:sessionId/end', authenticateToken, async (req, res, next) => {
  try {
    const session = await Session.findOne({ _id: req.params.sessionId, userId: req.user._id });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    if (session.status !== 'running') {
      return res.status(400).json({ error: 'Session is not running' });
    }
    
    session.status = 'ended';
    session.endedAt = new Date();
    session.duration = Math.floor((session.endedAt - session.startedAt) / 1000);
    await session.save();
    
    if (currentSessionUserId === req.user._id.toString()) {
      activeSessionLock = false;
      currentSessionUserId = null;
      resetVM(currentVMName).catch(console.error);
    }
    
    res.json({ message: 'Session ended. VM is being reset for next user.' });
  } catch (error) {
    next(error);
  }
});

router.post('/:sessionId/reset', authenticateToken, async (req, res, next) => {
  try {
    const session = await Session.findOne({ _id: req.params.sessionId, userId: req.user._id });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    if (session.status !== 'running') {
      return res.status(400).json({ error: 'Session is not running' });
    }
    
    const vmConfig = VM_CONFIGS[session.distroName] || DEFAULT_VM;
    await resetVM(vmConfig.vmName);
    
    res.json({ message: 'VM has been reset to clean state.' });
  } catch (error) {
    next(error);
  }
});

router.get('/status', authenticateToken, async (req, res, next) => {
  try {
    const isAvailable = !activeSessionLock || currentSessionUserId === req.user._id.toString();
    res.json({
      available: isAvailable,
      resetInProgress: resetInProgress,
      currentUserId: currentSessionUserId,
      currentVM: currentVMName,
      isCurrentUser: currentSessionUserId === req.user._id.toString()
    });
  } catch (error) {
    next(error);
  }
});

export default router;