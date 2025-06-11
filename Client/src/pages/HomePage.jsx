import React from 'react'
import { useUsersList } from '../hooks/useLogin';

const HomePage = () => {
    const { data, isLoading, error } = useUsersList();
    console.log(data);
  return (
    <div>
      <h1>Home Page</h1>

    </div>
  )
}

export default HomePage
