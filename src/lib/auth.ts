import { cookies } from 'next/headers';

export async function getSessionUser() {
  const cookieStore = await cookies();
  let userId = cookieStore.get('syncink_user_id')?.value;
  
  if (!userId) {
    userId = crypto.randomUUID();
    cookieStore.set('syncink_user_id', userId, { 
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1 year
      httpOnly: true,
      path: '/'
    });
  }
  
  return userId;
}
