import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../../firebaseConfig";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
    const googleProvider = new GoogleAuthProvider();

    const handleGoogleSignIn =async () => {
        try{
            await signInWithPopup(auth, googleProvider);
            navigate("/");
        } catch(error){
            alert(error.message);
        }
    } 

    const handleLogin = async (e) => {
       
        try{
            
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            if(user.emailVerified){
                alert("Login successful");
                navigate("/");
            } else {
                alert("Please verify your email before logging in.");
                return;
            }
            

        } catch(error){
            alert(error.message);
        }
    }
  return (
    <div className='bg-olive-dark h-screen flex justify-center items-center'>
      <div className='bg-beige p-10 rounded-lg shadow-2xl w-96 h-auto'>
        <div className='flex items-center justify-center'>
            <h1 className='text-2xl font-bold text-olive-dark'>Login</h1>
        </div>
        <div className='flex flex-col mt-5 py-10 gap-y-3'>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="text" placeholder='Email' className='border-2 border-olive rounded-lg p-2 w-72 mb-4'/>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder='Password' className='border-2 border-olive rounded-lg p-2 w-72 mb-4'/>
            <div className='flex flex-col items-center gap-3 justify-center'>
                <button onClick={handleLogin} className='bg-olive-dark text-white rounded-lg p-2 w-40 hover:bg-olive duration-700'>Login</button>
                <button onClick={handleGoogleSignIn} className='bg-olive-dark text-white rounded-lg p-2 w-40 hover:bg-olive duration-700'>Log in with Google</button>
            </div>
            <div className='flex justify-center mt-5'>
                <p className='text-gray-600'>Don't have an account?</p>
                <Link to="/signup">
                    <button className='text-olive-dark ml-2 hover:underline'>Sign Up</button>
                </Link>
            </div>
            
        </div>
      </div>
    </div>
  )
}

export default Login
