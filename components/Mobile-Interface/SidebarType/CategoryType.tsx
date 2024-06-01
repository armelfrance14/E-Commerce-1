import React from 'react'
import { navBtns } from '@/app/data'
import { useAppDispatch } from '@/app/hooks';
import { closeSidebar } from '@/features/UIUpdates/UISlice';
import { bestSell, leftStatus } from '@/app/data'
const CategoryType = () => {
    const socialMedia = ['facebook','twitter','instagram','linkedin'];
    const dispatch = useAppDispatch();
    return (
        <>
                <div className='flex w-[90%] items-center mt-5 justify-between'>
                    <p className='text-salmon font-bold text-lg tracking-[2px]'>CATEGORY</p>
                    <button  onClick={()=>{dispatch(closeSidebar())}}><i className="fa-solid fa-xmark fa-xl"></i></button>
                </div>
                <div className='w-[90%]'>
                    {leftStatus.map((each,index)=>
                    <div key={index} className='flex items-center justify-between mr-5'>
                        <div className='mt-2 pb-2 tracking-wider flex items-center gap-2'>
                            <img width={20} src={each.imgLink}/>
                            <p className='text-gray-500 tracking-[1px]'>{each.title}</p>
                        </div>
                        <div>
                            <p className='text-lg text-gray-500'>+</p>
                        </div>
                    </div>
                    )}
                </div>
                <div className='h-[500px] border-t-[1px] pt-2'>
                <p className='font-bold tracking-[2px] text-md'>BEST SELLERS</p>
                <div className='flex flex-col'>
                    {bestSell.map((each,index)=>
                        <div key={index} className='flex mt-5'>
                            <a href={each.productLink}><img className='w-[75px] h-[75px] rounded-md' src={each.imgLink}/></a>
                            <div className='ml-5'>
                                <a href={each.productLink}><p className='tracking-[1px]'>{each.title}</p></a>
                                <div></div>
                                <div className='flex items-center'>
                                    <p className='text-sm line-through'>${each.basePrice}</p>
                                    <p className='text-lg font-bold ml-4'>${each.discountPrice}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    </div>
                </div>
        </>
    )
}

export default CategoryType