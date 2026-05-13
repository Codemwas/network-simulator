// src/pages/Login.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithRedirect, GoogleAuthProvider, getRedirectResult } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Network, Mail, Lock, Chrome } from 'lucide-react';

// Mock user for local development when Firebase auth is not fully configured
const MOCK_USER = {
  uid: 'mock-user-123',
  email: 'admin@netsim.com',
  displayName: 'Admin User'
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

   const handleSubmit = async (e) => {
     e.preventDefault();
     setLoading(true);
     try {
       await signInWithEmailAndPassword(auth, email, password);
       toast.success('Welcome back!');
       navigate('/dashboard');
     } catch (error) {
       toast.error(error.message);
     } finally {
       setLoading(false);
     }
   };

   const handleForgotPassword = async () => {
     if (!email) {
       toast.error('Please enter your email address first');
       return;
     }
     toast.loading('Sending password reset email...', { id: 'reset' });
     try {
       const isDevPlaceholder = import.meta.env.VITE_FIREBASE_API_KEY?.includes('your_') ||
                                 !import.meta.env.VITE_FIREBASE_API_KEY;

       if (isDevPlaceholder && import.meta.env.DEV) {
         setTimeout(() => {
           toast.success('Password reset email sent (simulation - check console)', { id: 'reset' });
           console.log('Development mode: Password reset simulation for', email);
         }, 500);
         return;
       }

       // import { sendPasswordResetEmail } from 'firebase/auth';
       // await sendPasswordResetEmail(auth, email);

       toast.error('Password reset requires Firebase Authentication Email/Password to be enabled', { id: 'reset' });
     } catch (error) {
       toast.error(error.message, { id: 'reset' });
     }
   };

   const handleGoogleSignIn = async () => {
     // Development fallback: if Firebase config looks like placeholder, use mock login
     const isDevPlaceholder = import.meta.env.VITE_FIREBASE_API_KEY?.includes('your_') ||
                               !import.meta.env.VITE_FIREBASE_API_KEY;

     if (isDevPlaceholder && import.meta.env.DEV) {
       console.warn('Using mock Google sign-in (Firebase not configured)');
       // Mock successful sign-in
       setTimeout(() => {
         toast.success('Signed in with Google (Development Mode)');
         navigate('/dashboard');
       }, 500);
       return;
     }

     const provider = new GoogleAuthProvider();
     try {
       await signInWithRedirect(auth, provider);
     } catch (error) {
       if (error.code === 'auth/operation-not-allowed') {
         toast.error('Google sign-in is not enabled. Please enable it in Firebase Console or use email sign-in.');
       } else {
         toast.error(error.message);
       }
     }
   };

   // Handle redirect result when component mounts
   useEffect(() => {
     const handleRedirectResult = async () => {
       try {
         const result = await getRedirectResult(auth);
         if (result) {
           toast.success('Signed in with Google');
           navigate('/dashboard');
         }
       } catch (error) {
         // Only show error if it's not a user cancellation
         if (error.code !== 'auth/account-link-method-without-credential') {
           toast.error(error.message);
         }
       }
     };
     handleRedirectResult();
   }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-md p-8"
      >
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-primary-500/10 rounded-2xl mb-4">
            <Network className="w-10 h-10 text-primary-500" />
          </div>
          <h1 className="text-2xl font-bold">Welcome Back</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Sign in to continue to NetSim Pro</p>
        </div>

         <form onSubmit={handleSubmit} className="space-y-4">
           <div>
             <label className="block text-sm font-medium mb-2">Email</label>
             <div className="relative">
               <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
               <input
                 type="email"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                 placeholder="admin@netsim.com"
                 required
               />
             </div>
           </div>

           <div>
             <label className="block text-sm font-medium mb-2">Password</label>
             <div className="relative">
               <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
               <input
                 type="password"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                 placeholder="••••••••"
                 required
               />
             </div>
           </div>

           <div className="flex justify-end">
             <button
               type="button"
               onClick={handleForgotPassword}
               className="text-sm text-primary-500 hover:underline"
             >
               Forgot Password?
             </button>
           </div>

           <button
             type="submit"
             disabled={loading}
             className="w-full py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition disabled:opacity-50"
           >
             {loading ? 'Signing in...' : 'Sign In'}
           </button>
         </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">Or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          <Chrome size={18} />
          Google
        </button>

        <p className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-500 hover:underline">
            Sign up
          </Link>
        </p>
      </motion.div>
    </div>
  );
}