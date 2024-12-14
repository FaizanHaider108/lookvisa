import React from 'react'
import { Button } from './ui/button'
import { Search } from 'lucide-react'
import Link from 'next/link'

const Hero = () => {
    return (
        <div className='w-full h-[50vh] bg-blue-400'>
            <div className='container h-full mx-auto flex flex-col max-w-[800px] gap-4 items-center justify-center'>
                <h1 
                style={{lineHeight:"60px"}}
                className='text-4xl lg:text-[64px]  text-center font-bold text-white'> Find an immigrant investor to fund it in exchange for an investor visa.
                </h1>
                <p className='text-gray-200 text-center '>Let us introduce you through our platform to immigrant investors from multiple countries who ca provide funding and capital for your projects within a few hours.
                </p>
                <Button className="bg-blue-600 w-1/2 mx-auto hover:bg-blue-700">
                  <Link className='flex items-center gap-2 ' href={"/search"}>
                  Find Investor
                  <Search />
                </Link>
                </Button>
            </div>
        </div>
    )
}

export default Hero