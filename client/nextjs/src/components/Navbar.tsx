'use client';

import type { AutoCompleteTextProps } from '@/components/AutoCompleteText';

import Link from 'next/link';
import clsx from 'clsx';
import Search from './Search';
import AutoCompleteText from '@/components/AutoCompleteText';
import { getClientConfig } from '@/config/client-config';
import { clearAuthToken } from '@/utils/services';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface NavbarProps {
  path?: string;
  refreshProducts?: (searchData?: models.Product) => void;
  autoCompleteText?: AutoCompleteTextProps;
  searchPlaceHolder?: string;
}

export default function Navbar({ path = '', refreshProducts, autoCompleteText, searchPlaceHolder }: NavbarProps) {
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setUserRole(localStorage.getItem('userRole'));
  }, [path]); // re-run when path changes to detect login/logout

  const handleLogout = () => {
    clearAuthToken();
    sessionStorage.removeItem('myAuthToken');
    localStorage.removeItem('userRole');
    setUserRole(null);
    router.push('/login');
  };

  const isOrders = /orders/.test(path);
  const isAdmin = /admin/.test(path);
  const isLogin = /login/.test(path);
  const linkClass =
    'flex flex-initial items-center h-full pt-1 px-4 border-b-4 hover:text-terracotta-600 font-semibold transition-colors';
  const ordersClass = clsx(linkClass, {
    'border-transparent': !isOrders,
    'border-terracotta-500 text-terracotta-600': isOrders,
  });
  const adminClass = clsx(linkClass, {
    'border-transparent': !isAdmin,
    'border-terracotta-500 text-terracotta-600': isAdmin,
  });
  const loginClass = clsx(linkClass, {
    'border-transparent': !isLogin,
    'border-terracotta-500 text-terracotta-600': isLogin,
  });

  return (
    <nav className="fixed w-full px-5 flex justify-between items-center h-14 bg-cream-50/95 backdrop-blur border-b border-terracotta-100 shadow-sm z-20">
      <div>
        <Link
          prefetch={false}
          href="/"
          className="font-display text-ink-800 text-xl font-bold tracking-wide">
          Redis Shopping
        </Link>
      </div>

      <div
        id="main-nav"
        className="flex space-y-0 relative top-0 right-0 p-0 flex-row h-full flex-grow items-center ml-10">

        <div className="order-first flex flex-row items-center h-full text-ink-700 space-y-0 space-x-3">
          <Link prefetch={false} className={ordersClass} href="/orders">
            Orders
          </Link>

          {
            userRole === 'ADMIN' &&
            <Link prefetch={false} className={adminClass} href="/admin">
              Admin
            </Link>
          }

        </div>

        <div className='flex flex-grow justify-end'>
          {autoCompleteText?.listItems && Number(autoCompleteText.listItems.length) > 0 &&
            <div className='mr-2'>
              <AutoCompleteText listItems={autoCompleteText.listItems}
                placeHolder={autoCompleteText.placeHolder}
                suggestionSelectedCallback={autoCompleteText.suggestionSelectedCallback}>
              </AutoCompleteText>
            </div>
          }
          {!isOrders && !isAdmin && !isLogin &&
            <Search refreshProducts={refreshProducts} searchPlaceHolder={searchPlaceHolder} />
          }
        </div>

        <div className='flex items-center text-ink-700 space-x-4'>
          {userRole ? (
            <button onClick={handleLogout} className="hover:text-terracotta-600 transition-colors">
              Logout
            </button>
          ) : (
            <Link href="/login" className="hover:text-terracotta-600 transition-colors">
              Login
            </Link>
          )}
          <Link prefetch={false} href="/settings">
            <i className="fa fa-cog text-ink-700 hover:text-terracotta-600 text-xl transition-colors"></i>
          </Link>
        </div>
      </div>
    </nav>
  );
}
