'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login, registerUser } from '../../utils/services';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        const res = await login(username, password);
        if (res.error) {
          setError(res.error);
        } else {
          // Success
          localStorage.setItem('userRole', res.role);
          router.push('/');
        }
      } else {
        const res = await registerUser(username, password, role);
        if (res.error) {
          setError(res.error);
        } else {
          setIsLogin(true);
          setError('Registration successful   ! Please login.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-cream-100 deco-frame">
      <div className="bg-white p-8 rounded-xl shadow-card w-96 border border-terracotta-100">
        <h2 className="text-2xl font-display font-bold mb-4 text-center text-ink-800">
          {isLogin ? 'Login' : 'Register'}
        </h2>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-ink-700 text-sm font-bold mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="shadow-sm appearance-none border border-terracotta-100 rounded-lg w-full py-2 px-3 text-ink-800 leading-tight focus:outline-none focus:border-terracotta-300"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-ink-700 text-sm font-bold mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="shadow-sm appearance-none border border-terracotta-100 rounded-lg w-full py-2 px-3 text-ink-800 mb-3 leading-tight focus:outline-none focus:border-terracotta-300"
              required
            />
          </div>

          {!isLogin && (
            <div className="mb-6">
              <label className="block text-ink-700 text-sm font-bold mb-2">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="shadow-sm border border-terracotta-100 rounded-lg w-full py-2 px-3 text-ink-800 leading-tight focus:outline-none focus:border-terracotta-300"
              >
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-terracotta-500 hover:bg-terracotta-600 text-white font-bold py-2 px-4 rounded-full focus:outline-none w-full transition-colors"
            >
              {isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-terracotta-600 hover:text-terracotta-800 text-sm"
          >
            {isLogin
              ? "Don't have an account? Register"
              : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    </div>
  );
}
