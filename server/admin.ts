import { z } from 'zod';
import { adminProcedure, publicProcedure, router } from './_core/trpc';
import {
  readActiveUsers,
  addActiveUser,
  removeActiveUser,
  getActiveUsersByIP,
  readBannedIPs,
  addBannedIP,
  removeBannedIP,
  isIPBanned,
  readNotifications,
  addNotification,
  getRecentNotifications,
  clearOldNotifications,
} from './persistence';

export const adminRouter = router({
  getActiveUsers: adminProcedure.query(() => {
    return readActiveUsers();
  }),

  getActiveUsersByIP: adminProcedure
    .input(z.object({ ip: z.string() }))
    .query(({ input }) => {
      return getActiveUsersByIP(input.ip);
    }),

  kickUserByIP: adminProcedure
    .input(z.object({ ip: z.string(), reason: z.string().optional() }))
    .mutation(({ input }) => {
      const users = getActiveUsersByIP(input.ip);
      users.forEach(user => {
        removeActiveUser(user.id);
      });
      addBannedIP(input.ip, input.reason || 'Kicked by admin');
      return {
        success: true,
        usersKicked: users.length,
        ip: input.ip,
      };
    }),

  getBannedIPs: adminProcedure.query(() => {
    return readBannedIPs();
  }),

  removeBan: adminProcedure
    .input(z.object({ ip: z.string() }))
    .mutation(({ input }) => {
      removeBannedIP(input.ip);
      return {
        success: true,
        ip: input.ip,
      };
    }),

  sendNotification: adminProcedure
    .input(z.object({
      message: z.string(),
      type: z.enum(['warning', 'info', 'error']).default('info'),
    }))
    .mutation(({ input, ctx }) => {
      const notification = addNotification({
        message: input.message,
        type: input.type,
        sentBy: ctx.user?.name || 'DEV',
        timestamp: Date.now(),
      });
      return notification;
    }),

  getNotifications: publicProcedure.query(() => {
    return getRecentNotifications(50);
  }),

  checkIPBan: publicProcedure
    .input(z.object({ ip: z.string() }))
    .query(({ input }) => {
      return {
        isBanned: isIPBanned(input.ip),
        ip: input.ip,
      };
    }),

  registerSession: publicProcedure
    .input(z.object({
      userId: z.string(),
      key: z.string(),
      ip: z.string(),
      hwid: z.string(),
      keyLevel: z.enum(['BASIC', 'PRO', 'DEV']),
    }))
    .mutation(({ input }) => {
      if (isIPBanned(input.ip)) {
        return {
          success: false,
          message: 'IP está banido',
        };
      }
      addActiveUser({
        id: input.userId,
        key: input.key,
        ip: input.ip,
        hwid: input.hwid,
        timestamp: Date.now(),
        keyLevel: input.keyLevel,
      });
      return {
        success: true,
        message: 'Sessão registrada',
      };
    }),

  unregisterSession: publicProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(({ input }) => {
      removeActiveUser(input.userId);
      return {
        success: true,
      };
    }),

  clearOldNotifications: adminProcedure.mutation(() => {
    clearOldNotifications();
    return {
      success: true,
    };
  }),
});
