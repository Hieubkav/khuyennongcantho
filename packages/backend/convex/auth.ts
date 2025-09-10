"use node";

import { action } from './_generated/server';
import { v } from 'convex/values';
import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';
import { api as generatedApi } from './_generated/api';
const apiAny = generatedApi as any;

function hashPassword(password: string, salt?: string) {
  const usedSalt = salt ?? randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, usedSalt, 100_000, 64, 'sha512').toString('hex');
  return { salt: usedSalt, hash };
}

export const verifyCredentials = action({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const user = await ctx.runQuery(apiAny.profiles.getSecretsByEmail, { email });
    if (!user) return null;
    if (!user.active) return null;
    if (!user.passwordSalt || !user.passwordHash) return null;
    const { hash } = hashPassword(args.password, user.passwordSalt);
    if (timingSafeEqual(Buffer.from(hash), Buffer.from(user.passwordHash))) {
      const { passwordHash, passwordSalt, ...rest } = user as any;
      return rest;
    }
    return null;
  },
});

export const createUser = action({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    role: v.union(v.literal('admin'), v.literal('member')),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const { salt, hash } = hashPassword(args.password);
    const id = await ctx.runMutation(apiAny.profiles.create, {
      email,
      name: args.name,
      role: args.role,
      passwordHash: hash,
      passwordSalt: salt,
    });
    return id;
  },
});

export const changePassword = action({
  args: {
    email: v.string(),
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    if (args.newPassword.length < 6) throw new Error('Mật khẩu mới phải từ 6 ký tự');
    const user = await ctx.runQuery(apiAny.profiles.getSecretsByEmail, { email });
    if (!user) throw new Error('Không tìm thấy tài khoản');
    if (!user.active) throw new Error('Tài khoản đã bị khoá');
    if (!user.passwordSalt || !user.passwordHash) throw new Error('Tài khoản chưa có mật khẩu');

    // Verify current password
    const { hash: currentHash } = hashPassword(args.currentPassword, user.passwordSalt);
    if (!timingSafeEqual(Buffer.from(currentHash), Buffer.from(user.passwordHash))) {
      throw new Error('Mật khẩu hiện tại không đúng');
    }

    // Update to new password
    const { salt, hash } = hashPassword(args.newPassword);
    await ctx.runMutation(apiAny.profiles.update, {
      id: user._id,
      passwordHash: hash,
      passwordSalt: salt,
      mustChangePassword: false,
      passwordUpdatedAt: Date.now(),
    });
    return { success: true };
  },
});

export const issueTempPassword = action({
  args: { profileId: v.id('profiles'), length: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const profile = await ctx.runQuery(apiAny.profiles.getById, { id: args.profileId });
    if (!profile) throw new Error('Không tìm thấy tài khoản');
    if (!profile.active) throw new Error('Tài khoản đã bị khoá');

    const length = args.length ?? 10;
    const raw = randomBytes(Math.ceil(length)).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, length);
    const { salt, hash } = hashPassword(raw);

    await ctx.runMutation(apiAny.profiles.update, {
      id: args.profileId,
      passwordHash: hash,
      passwordSalt: salt,
      mustChangePassword: true,
      passwordUpdatedAt: Date.now(),
    });

    return { password: raw };
  },
});

