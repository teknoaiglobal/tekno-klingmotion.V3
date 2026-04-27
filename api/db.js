// Mockup Database for Vercel Dev
// Note: In production Vercel (serverless), this state will be reset on cold boots.
// We use global to persist state across hot reloads in dev mode.

const initialDb = {
  users: [
    {
      id: 'admin',
      name: 'Admin User',
      role: 'admin',
      plan: 'vip',
      credits: 9999,
      subscription_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'user1',
      name: 'Test Member',
      role: 'member',
      plan: 'free',
      credits: 10,
      subscription_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ],
  vouchers: [],
  apiKeys: [
    { id: '1', key_string: 'FPSX14489435804c999da3c0411e2d0eb929', usage_count: 0, is_active: true },
    { id: '2', key_string: 'FPSX15b7532ef8a19adb491e7770e6a5df24', usage_count: 0, is_active: true },
    { id: '3', key_string: 'FPSX78a3ce4528de71ff66edc69fb5f3130c', usage_count: 0, is_active: true }
  ],
  tasks: []
};

if (!global.mockDb) {
  global.mockDb = initialDb;
}

export const db = global.mockDb;
