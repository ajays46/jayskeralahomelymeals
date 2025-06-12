import React from 'react'
import { useUsersList } from '../hooks/useLogin';
import Navbar from '../components/Navbar';

const HomePage = () => {
    const { data, isLoading, error } = useUsersList();
    console.log(data);
  return (
    <div>
      <header >
      <div className='bg-[url("/navImage.jpeg")] bg-cover bg-center h-52 lg:h-96'>

      <Navbar />
      </div>
     

      </header>
     
    </div>
  )
}

export default HomePage
