import React, { useState } from 'react';
import { UserIcon } from '@heroicons/react/24/outline';
import { useApp } from '@/Helpers/AccountDialog';
const Account = () => {
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const { appState } = useApp();
  return (
    <div onMouseEnter={()=>setDropdownVisible(true)} onMouseLeave={()=>setDropdownVisible(false)} className="relative mx-auto my-auto">
      <button className='mb-2'>
        <UserIcon width={40}/>
      </button>
      {(isDropdownVisible && appState.loggedIn) && (
        <div id="dropdownAvatar" className="z-30 bg-white divide-y divide-gray-100 rounded-lg absolute drop-shadow-custom-xl w-44">
          <div className="px-4 py-3 text-sm text-gray-500 ">
            <div>Alan Walk</div>
          </div>
          <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownUserAvatarButton">
            <li>
              <a href="/account-settings" className="block px-4 py-2 hover:bg-gray-100 text-gray-500">Settings</a>
            </li>
            <li>
              <a href="/orders" className="block px-4 py-2 hover:bg-gray-100 text-gray-500">Orders</a>
            </li>
          </ul>
          <div className="py-2">
            <a href="#" className="block px-4 py-2 text-sm text-gray-400 hover:bg-gray-100">Sign out</a>
          </div>
        </div>
      )}
      {(isDropdownVisible && !appState.loggedIn) && (
        <div id="dropdownAvatar" className="z-30 bg-white divide-y divide-gray-100 rounded-lg absolute drop-shadow-custom-xl w-44">
          <div className="px-4 py-3 text-sm text-gray-500 flex gap-2">
            <div>New User?</div>
            <a href='/sign-up' className='text-primary-800'>Register</a>
          </div>
          <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownUserAvatarButton">
            <li>
              <a href="/sign-in" className="block px-4 py-2 text-primary-800 hover:bg-gray-100">Sign In</a>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default Account;
