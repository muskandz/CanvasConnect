import React, { useState, useEffect } from 'react';
import { auth } from '../firebaseConfig';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, updateProfile } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User,
  ArrowRight, 
  Star, 
  Sparkles,
  Users,
  Palette,
  MessageCircle,
  Home,
  CheckCircle,
  Loader,
  Shield,
  Zap,
  Globe
} from 'lucide-react';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();
  const googleProvider = new GoogleAuthProvider();

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    // Calculate password strength
    const calculateStrength = (password) => {
      let strength = 0;
      if (password.length >= 8) strength += 25;
      if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength += 25;
      if (password.match(/\d/)) strength += 25;
      if (password.match(/[^a-zA-Z\d]/)) strength += 25;
      return strength;
    };

    setPasswordStrength(calculateStrength(formData.password));
  }, [formData.password]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setIsLoading(false);
      return;
    }
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      
      // Update user profile with name
      await updateProfile(userCredential.user, {
        displayName: formData.name
      });
      
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err.code));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err.code));
    } finally {
      setIsLoading(false);
    }
  };

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/operation-not-allowed':
        return 'Email/password accounts are not enabled.';
      default:
        return 'Account creation failed. Please try again.';
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 25) return 'bg-red-500';
    if (passwordStrength <= 50) return 'bg-yellow-500';
    if (passwordStrength <= 75) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 25) return 'Weak';
    if (passwordStrength <= 50) return 'Fair';
    if (passwordStrength <= 75) return 'Good';
    return 'Strong';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 flex overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Floating Sticky Notes */}
        <div 
          className="absolute transition-transform duration-1000 ease-out opacity-40"
          style={{
            left: `${120 + mousePosition.x * 0.015}px`,
            top: `${100 + mousePosition.y * 0.01}px`,
            transform: `rotate(${-8 + mousePosition.x * 0.008}deg)`
          }}
        >
          <div className="w-14 h-14 bg-blue-300 shadow-lg transform rotate-6">
            <div className="w-full h-2 bg-blue-400"></div>
            <div className="p-2 text-xs text-gray-700">Join us!</div>
          </div>
        </div>

        <div 
          className="absolute transition-transform duration-1000 ease-out opacity-30"
          style={{
            right: `${60 + mousePosition.x * 0.012}px`,
            bottom: `${180 + mousePosition.y * 0.018}px`,
            transform: `rotate(${12 - mousePosition.x * 0.008}deg)`
          }}
        >
          <div className="w-18 h-18 bg-green-300 shadow-lg transform -rotate-8">
            <div className="w-full h-2 bg-green-400"></div>
            <div className="p-2 text-xs text-gray-700">Create!</div>
          </div>
        </div>

        {/* Floating Stars */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse opacity-25"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          >
            <Star className="w-3 h-3 text-blue-400 fill-current" />
          </div>
        ))}

        {/* Geometric Shapes */}
        <div className="absolute top-1/3 left-1/6 w-24 h-24 border-3 border-purple-200 rounded-full animate-spin opacity-20" style={{ animationDuration: '30s' }}></div>
        <div className="absolute bottom-1/4 right-1/6 w-20 h-20 bg-gradient-to-br from-blue-200 to-purple-200 rounded-lg transform rotate-45 animate-bounce opacity-25"></div>
      </div>

      {/* Left Side - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
        {/* Theme Toggle - Fixed position */}
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>
        
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden mb-8 text-center">
            <Link to="/" className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors mb-4">
              <Home className="w-5 h-5" />
              <span>Back to Home</span>
            </Link>
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">CC</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">CanvasConnect</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Collaborative Workspace</p>
              </div>
            </div>
          </div>

          {/* Form Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create your account</h2>
            <p className="text-gray-600 dark:text-gray-300">Start collaborating with your team today</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSignup} className="space-y-6">
            {/* Name Input */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-400"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-400"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-400"
                  placeholder="Create a secure password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Password strength</span>
                    <span className={`font-medium ${
                      passwordStrength <= 25 ? 'text-red-600' :
                      passwordStrength <= 50 ? 'text-yellow-600' :
                      passwordStrength <= 75 ? 'text-blue-600' : 'text-green-600'
                    }`}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${getPasswordStrengthColor()}`}
                      style={{ width: `${passwordStrength}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Input */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-400"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Terms and Privacy Policy */}
            <div className="flex items-start">
              <input
                id="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
              />
              <label htmlFor="terms" className="ml-3 text-sm text-gray-600">
                I agree to the{' '}
                <Link to="/terms" className="text-blue-600 hover:text-blue-700 font-medium">
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-blue-600 hover:text-blue-700 font-medium">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Signup Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="group w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Create account</span>
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>
          </div>

          {/* Google Signup */}
          <button
            onClick={handleGoogleSignup}
            disabled={isLoading}
            className="mt-4 w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-gray-700 font-medium">Continue with Google</span>
          </button>

          {/* Login Link */}
          <div className="mt-8 text-center space-y-3">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Sign in
              </Link>
            </p>
            <p className="text-sm text-gray-500">
              Forgot your password?{' '}
              <Link 
                to="/forgot-password" 
                className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Reset it here
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Benefits & Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-600 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 400 400">
            <defs>
              <pattern id="signupGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#signupGrid)" />
          </svg>
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center space-x-3 text-white hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <span className="text-white font-bold text-xl">CC</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">CanvasConnect</h1>
              <p className="text-sm text-blue-100">Collaborative Workspace</p>
            </div>
          </Link>
        </div>

        {/* Benefits */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
              Join thousands of teams
              <span className="block text-blue-200">creating amazing things</span>
            </h2>
            <p className="text-xl text-blue-100 leading-relaxed">
              Start your journey with the most intuitive collaborative workspace platform.
            </p>
          </div>

          <div className="space-y-6">
            {[
              { 
                icon: Users, 
                title: 'Team Collaboration', 
                description: 'Work together in real-time with unlimited team members' 
              },
              { 
                icon: Zap, 
                title: 'Lightning Fast', 
                description: 'Get started in seconds with our intuitive interface' 
              },
              { 
                icon: Shield, 
                title: 'Enterprise Security', 
                description: 'Your data is protected with bank-level encryption' 
              },
              { 
                icon: Globe, 
                title: 'Global Access', 
                description: 'Access your workspace from anywhere in the world' 
              }
            ].map((benefit, index) => (
              <div 
                key={index}
                className="flex items-start space-x-4 text-white"
              >
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{benefit.title}</h3>
                  <p className="text-blue-100 text-sm">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Social Proof */}
        <div className="relative z-10 bg-white bg-opacity-10 rounded-2xl p-6 backdrop-blur-sm">
          <div className="text-center">
            <div className="flex justify-center space-x-8 mb-4">
              <div>
                <div className="text-2xl font-bold text-white">10,000+</div>
                <div className="text-blue-200 text-sm">Active Users</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">500+</div>
                <div className="text-blue-200 text-sm">Companies</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">99.9%</div>
                <div className="text-blue-200 text-sm">Uptime</div>
              </div>
            </div>
            <div className="flex justify-center text-yellow-400 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <p className="text-white text-sm italic">
              "The best collaborative platform we've ever used!"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
