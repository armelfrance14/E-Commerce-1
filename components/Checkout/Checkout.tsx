import React,{useLayoutEffect,useState,useRef, useEffect} from 'react'
import userData from '@/controllers/userData';
import useAuth from '@/controllers/Authentication';
import { useParams } from 'next/navigation'
import { useApp } from '@/Helpers/AccountDialog';
import Loading from '../Loading';
import { useRouter } from 'next/navigation';
import paymentGatewayHandler, { checkoutProductDataHandler, paymentOnDeliveryHandler } from '@/app/api/paymentSystem';
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "./CheckoutForm";
import Link from 'next/link';
import { useAppSelector } from '@/app/hooks';
interface ProductDetails {
  title: string;
  price: string;
  discount: string;
  sizename: string;
  colorname: string;
  imglink: string;
  imgalt: string;
  shippingcost: number;
}
interface Address {
    addressID:number;
    addressType:string;
    contactNumber:number;
    addressLine1:string
    addressLine2:string
    city:string;
    state:string;
    country:string;
    postalCode:string;
    userName:string;
    is_default:boolean;
}
interface Account{
    userID:number;
    userName:string;
    email:string;
    mobile_number:number|string;
    dob:string;
}
// Example object of ProductDetails with default values
const emptyProductDetails: ProductDetails = {
  title: '',
  price: '0',
  discount: '0',
  sizename: '',
  colorname: '',
  imglink: '',
  imgalt: '',
  shippingcost:0
};
const Checkout = () => {
    const {appState} = useApp();
    const loggedIn = appState.loggedIn;
    const [paymentCharge, setPaymentCharge] = useState(0);
    const params = useParams<{ productID: string,colorID:string,sizeID:string }>()
    const [loading, setloading] = useState(true);
    const [clientSecret, setClientSecret] = useState("");
    const dataChecked = useRef(false);
    const found = useRef(false);
    const [onlinePayment, setonlinePayment] = useState(true);
    const router = useRouter();
    const dataVar = useRef<ProductDetails>(emptyProductDetails);
    const data = dataVar.current
    const genUserData = useRef<Account>({
        userID:0,
        userName:'',
        email:'',
        mobile_number:'',
        dob:''
    });
    const genUserAddress = useRef<Address>({
        addressID:0,
        addressType:'HOME',
        contactNumber:0,
        addressLine1:'',
        addressLine2:'',
        city:'',
        state:'',
        country:'',
        postalCode:'',
        userName:'',
        is_default:true
    });
    const shipping = data.shippingcost;
    const taxes = (parseFloat(data.price) * (18 / 100));
    const subTotal = parseFloat(data.price)+taxes;
    const discount = parseFloat(data.price) - parseFloat(data.discount);
    const totalAmount = (subTotal + shipping + paymentCharge)-taxes-discount;
    const formattedSubTotal = subTotal.toFixed(2);
    const formattedShipping = shipping.toFixed(2);
    const formattedTaxes = taxes.toFixed(2);
    const formattedDiscount = discount.toFixed(2);
    const formattedTotalAmount = totalAmount.toFixed(2);
    const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string);
    const {checkSession} = useAuth();
    const { grabUserData } = userData();
    const orderCreationError = useRef(false);
    async function dataRequest(){
        const response = await checkoutProductDataHandler({productID:params.productID,colorID:params.colorID,sizeID:params.sizeID});
        switch (response.status) {
          case 200:
          dataVar.current = response.data;
          found.current = true;
          break;
          case 500:
            router.push('/')
            break;
        default:
            router.push('/');
            break;
          }
    }
    async function sync(){
      await dataRequest();
      if(!found.current) return;
      const sessionCheck = await checkSession();
      const userDataCheck = await grabUserData();
      dataChecked.current = true;
      if(sessionCheck?.success && userDataCheck?.success) {
        if(sessionCheck.data != undefined) genUserData.current = sessionCheck.data;
        if(userDataCheck.addresses != undefined && userDataCheck.addresses.length > 0) userDataCheck.addresses.map((each)=>{if(each.is_default) genUserAddress.current=each;})
        paymentGateway();
        loading && setloading(false);
      }else{
        router.push('/sign-in');
      }
    }
    async function paymentGateway(){
        !loading && setloading(true);
        const ClientS = await paymentGatewayHandler(params.productID);
        setClientSecret(ClientS.clientSecret);
        setloading(false);
    }
    async function createOrder(e:any){
        e.preventDefault();
        setloading(true);
        const createOrder = await paymentOnDeliveryHandler({userid:genUserData.current.userID,productid:params.productID,colorid:params.colorID,sizeid:params.sizeID})
        switch (createOrder.status) {
            case 200:
                setloading(false);
                router.push(`/order-confirmation/${createOrder.data.orderid}`)
                break;
            default:
                orderCreationError.current=true;
                setloading(false);
                break;
        }
    }
    useLayoutEffect(() => {
      sync();
    }, []);
    
    const appearance:{theme:"stripe"|"night"} = {
        theme: "stripe",
    };
    const options = {
        clientSecret,
        appearance
    };
  return (
    <section className="bg-white py-8 h-screen w-screen overflow-x-hidden antialiased relative dark:bg-gray-900 md:py-6">
    {loading && <div className='w-screen h-screen absolute'>{loading && <div className='absolute left-0 right-0 top-[30%] z-50'><Loading/></div>}</div> }
    <form action="/" onSubmit={createOrder} className="mx-auto max-w-screen-xl px-4 2xl:px-0">
        <ol className="items-center flex w-full max-w-2xl text-center text-sm font-medium text-gray-500 dark:text-gray-400 sm:text-base">
        <li className="after:border-1 flex items-center text-primary-700 after:mx-6 after:hidden after:h-1 after:w-full after:border-b after:border-gray-200 dark:text-primary-500 dark:after:border-gray-700 sm:after:inline-block sm:after:content-[''] md:w-full xl:after:mx-10">
            <span className="flex items-center after:mx-2 after:text-gray-200 after:content-['/'] dark:after:text-gray-500 sm:after:hidden">
            <svg className="me-2 h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.5 11.5 11 14l4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            Product
            </span>
        </li>

        <li className="after:border-1 flex items-center text-primary-700 after:mx-6 after:hidden after:h-1 after:w-full after:border-b after:border-gray-200 dark:text-primary-500 dark:after:border-gray-700 sm:after:inline-block sm:after:content-[''] md:w-full xl:after:mx-10">
            <span className="flex items-center after:mx-2 after:text-gray-200 after:content-['/'] dark:after:text-gray-500 sm:after:hidden">
            <svg className="me-2 h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.5 11.5 11 14l4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            Checkout
            </span>
        </li>

        <li className="flex shrink-0 items-center">
            <svg className="me-2 h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.5 11.5 11 14l4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            Order summary
        </li>
        </ol>

        <div className="mt-6 sm:mt-8 lg:flex lg:items-start lg:gap-12 xl:gap-16">
        <div className="min-w-0 flex-1 space-y-8">
            <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Delivery Details</h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                <label htmlFor="your_name" className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"> Your name </label>
                <input disabled={true} value={genUserData.current.userName} type="text" id="your_name" className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500" placeholder="Suresh Kumar" required />
                </div>

                <div>
                <label htmlFor="your_email" className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"> Your email* </label>
                <input disabled={true} value={genUserData.current.email} type="email" id="your_email" className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500" placeholder="suresh@gmail.com" required />
                </div>

                <div>
                <div className="mb-2 flex items-center gap-2">
                    <label htmlFor="select-country-input-3" className="block text-sm font-medium text-gray-900 dark:text-white"> Country* </label>
                </div>
                <input disabled={true} value={genUserAddress.current.country} type='text' placeholder='India' id="select-country-input-3" className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500" required/>
                </div>

                <div>
                <div className="mb-2 flex items-center gap-2">
                    <label htmlFor="select-city-input-3" className="block text-sm font-medium text-gray-900 dark:text-white"> City* </label>
                </div>
                <input disabled={true} value={genUserAddress.current.city} type='text' placeholder='Delhi' id="select-city-input-3" className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500" required/>
                </div>

                <div>
                <label htmlFor="phone-input-3" className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"> Phone Number* </label>
                <div className="flex items-center">
                    <button id="dropdown-phone-button-3" data-dropdown-toggle="dropdown-phone-3" className="z-10 inline-flex shrink-0 items-center rounded-s-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-center text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus:ring-4 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-700" type="button">
                    +91
                    </button>
                    <div className="relative w-full">
                    <input disabled={true} value={genUserData.current.mobile_number} type="text" maxLength={10} minLength={10} id="phone-input" className="z-20 block w-full rounded-e-lg border border-s-0 border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:border-s-gray-700  dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500" pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}" placeholder="123-456-7890" required />
                    </div>
                </div>
                </div>

                <div>
                <label htmlFor="pincode" className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"> Pin Code </label>
                <input disabled={true} value={genUserAddress.current.postalCode} type="number" minLength={6} maxLength={10} id="pincode" className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500" placeholder="100111" required />
                </div>

                <div>
                <label htmlFor="address1" className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Address 1</label>
                <input disabled={true} value={genUserAddress.current.addressLine1} type="text" id="address1" className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500" placeholder="Address Line 1" required />
                </div>

                <div>
                <label htmlFor="address2" className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Address 2</label>
                <input disabled={true} value={genUserAddress.current.addressLine2} type="text" id="address2" className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500" placeholder="Address Line 2" required />
                </div>

                {/* <div className="sm:col-span-2">
                <button type="button" className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-100 hover:text-primary-700 focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-gray-700">
                    <svg className="h-5 w-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14m-7 7V5" />
                    </svg>
                    Add new address
                </button>
                </div> */}
            </div>
            </div>

            <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Payment</h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 ps-4 dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-start">
                    <div className="flex h-5 items-center">
                    <input onClick={()=>{setonlinePayment(true);setPaymentCharge(0)}} id="online-payment" aria-describedby="online-payment-text" type="radio" name="payment-method" value="" className="h-4 w-4 border-gray-300 bg-white text-primary-600 focus:ring-2 focus:ring-primary-600 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-primary-600" defaultChecked />
                    </div>

                    <div className="ms-4 text-sm">
                    <label htmlFor="online-payment" className="font-medium leading-none text-gray-900 dark:text-white"> Online Payment </label>
                    <p id="online-payment-text" className="mt-1 text-xs font-normal text-gray-500 dark:text-gray-400">Pay with your Bank/Card</p>
                    </div>
                </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 ps-4 dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-start">
                    <div className="flex h-5 items-center">
                    <input onClick={()=>{setonlinePayment(false);setPaymentCharge(15)}} id="pay-on-delivery" aria-describedby="pay-on-delivery-text" type="radio" name="payment-method" value="" className="h-4 w-4 border-gray-300 bg-white text-primary-600 focus:ring-2 focus:ring-primary-600 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-primary-600" />
                    </div>

                    <div className="ms-4 text-sm">
                    <label htmlFor="pay-on-delivery" className="font-medium leading-none text-gray-900 dark:text-white"> Payment on delivery </label>
                    <p id="pay-on-delivery-text" className="mt-1 text-xs font-normal text-gray-500 dark:text-gray-400">+$15 payment processing fee</p>
                    </div>
                </div>
                </div>

            </div>
            </div>

            {/* <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Delivery Methods</h3> */}

            {/* <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 ps-4 dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-start">
                    <div className="flex h-5 items-center">
                    <input id="dhl" aria-describedby="dhl-text" type="radio" name="delivery-method" value="" className="h-4 w-4 border-gray-300 bg-white text-primary-600 focus:ring-2 focus:ring-primary-600 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-primary-600" />
                    </div>

                    <div className="ms-4 text-sm">
                    <label htmlFor="dhl" className="font-medium leading-none text-gray-900 dark:text-white"> $15 - DHL Fast Delivery </label>
                    <p id="dhl-text" className="mt-1 text-xs font-normal text-gray-500 dark:text-gray-400">Get it by Tommorow</p>
                    </div>
                </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 ps-4 dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-start">
                    <div className="flex h-5 items-center">
                    <input id="fedex" aria-describedby="fedex-text" type="radio" name="delivery-method" value="" className="h-4 w-4 border-gray-300 bg-white text-primary-600 focus:ring-2 focus:ring-primary-600 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-primary-600" defaultChecked />
                    </div>

                    <div className="ms-4 text-sm">
                    <label htmlFor="fedex" className="font-medium leading-none text-gray-900 dark:text-white"> Free Delivery - FedEx </label>
                    <p id="fedex-text" className="mt-1 text-xs font-normal text-gray-500 dark:text-gray-400">Get it by {getDateXDaysFromNow(4)}</p>
                    </div>
                </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 ps-4 dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-start">
                    <div className="flex h-5 items-center">
                    <input id="express" aria-describedby="express-text" type="radio" name="delivery-method" value="" className="h-4 w-4 border-gray-300 bg-white text-primary-600 focus:ring-2 focus:ring-primary-600 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-primary-600" />
                    </div>

                    <div className="ms-4 text-sm">
                    <label htmlFor="express" className="font-medium leading-none text-gray-900 dark:text-white"> $49 - Express Delivery </label>
                    <p id="express-text" className="mt-1 text-xs font-normal text-gray-500 dark:text-gray-400">Get it today</p>
                    </div>
                </div>
                </div>
            </div>
            </div> */}
            <div className="p-4 mb-8 flex flex-col gap-4">
                <div className="flex border-[1px] min-h-[150px] rounded-xl px-6 py-6 items-center mb-4">
                    <img src={data.imglink} alt={data.imgalt} width={100} height={100} className="mr-10 bg-gray-50 rounded-xl"/>
                    <div className='flex flex-col gap-5 sm:gap-0 sm:flex-row justify-between w-full items-center'>
                    <div className={`flex flex-col ${(data.sizename != null || data.colorname != null) ? 'gap-1' : 'gap-5'}`}>
                        <h4 className="font-medium text-xl">{data.title}</h4>
                        {data.sizename != null && <p className='text-sm font-medium'>Size: <span className='font-semibold'>{data.sizename}</span></p>}
                        {data.colorname != null && <p className='text-sm font-medium'>Color: <span className='font-semibold'>{data.colorname}</span></p>}
                        <p className='text-sm text-silver'>Quantity: <span className='text-black font-semibold'>{1}</span></p>
                    </div>
                    <div>
                        <p className='font-medium text-3xl'>${data.discount}</p>
                        <p className='font-medium text-xl line-through'>${data.price}</p>
                    </div>
                    </div>
                </div>
            </div>
            <div>
            <label htmlFor="voucher" className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"> Enter a gift card, voucher or promotional code </label>
            <div className="flex max-w-md items-center gap-4">
                <input type="text" id="voucher" className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500" placeholder="" />
                <button type="button" className="flex items-center justify-center rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800">Apply</button>
            </div>
            </div>
        </div>
        

        <div className="mt-6 w-full space-y-6 sm:mt-8 lg:mt-0 lg:max-w-xs xl:max-w-md">
            <div className="flow-root">
            <div className="-my-3 divide-y divide-gray-200 dark:divide-gray-800">
                <dl className="flex items-center justify-between gap-4 py-3">
                <dt className="text-base font-normal text-gray-500 dark:text-gray-400">Subtotal</dt>
                <dd className="text-base font-medium text-gray-900 dark:text-white">${formattedSubTotal}</dd>
                </dl>

                <dl className="flex items-center justify-between gap-4 py-3">
                <dt className="text-base font-normal text-gray-500 dark:text-gray-400">Shipping Charge</dt>
                <dd className="text-base font-medium text-gray-900">${formattedShipping}</dd>
                </dl>

                {paymentCharge != 0 && <dl className="flex items-center justify-between gap-4 py-3">
                <dt className="text-base font-normal text-gray-500 dark:text-gray-400">Payment Processing Charge</dt>
                <dd className="text-base font-medium text-gray-900 dark:text-white">${paymentCharge}</dd>
                </dl>}

                <dl className="flex items-center justify-between gap-4 py-3">
                <dt className="text-base font-normal text-gray-500 dark:text-gray-400">Taxes</dt>
                <dd className="text-base font-medium text-gray-900 dark:text-white">${formattedTaxes}</dd>
                </dl>

                <dl className="flex items-center justify-between gap-4 py-3">
                <dt className="text-base font-normal text-gray-500 dark:text-gray-400">Discount</dt>
                <dd className="text-base font-medium text-green-500 dark:text-white">${formattedDiscount}</dd>
                </dl>

                <dl className="flex items-center justify-between gap-4 py-3">
                <dt className="text-base font-bold text-gray-900 dark:text-white">Total</dt>
                <dd className="text-base font-bold text-gray-900 dark:text-white">${formattedTotalAmount}</dd>
                </dl>
            </div>
            </div>

            <div className="space-y-3">
            {!onlinePayment && <button disabled={!loggedIn} type="submit" className="flex w-full items-center justify-center rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-800 focus:outline-none focus:ring-4  focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800">Place Order</button>}
            </div>
            <div id='payment-integration' className={`payment-integration`}>
                {(clientSecret && onlinePayment) && (
                    <Elements options={options} stripe={stripePromise}>
                    <CheckoutForm />
                    </Elements>
                )}
            </div>
        </div>
        </div>
    </form>
        
    </section>
  )
}

export default Checkout