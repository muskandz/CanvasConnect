import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { 
  updateProfile, 
  updatePassword, 
  deleteUser, 
  reauthenticateWithCredential, 
  EmailAuthProvider,
  signOut 
} from 'firebase/auth';
import axios from 'axios';
import ThemeToggle from '../components/ThemeToggle';
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  Trash2,
  AlertTriangle,
  Eye,
  EyeOff,
  Save,
  Shield,
  Database,
  FileText,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  Loader
} from 'lucide-react';

export default function AccountSettings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Profile update state
  const [profileData, setProfileData] = useState({
    displayName: '',
    email: ''
  });
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  // Account deletion state
  const [deleteStep, setDeleteStep] = useState(0); // 0: initial, 1: confirmation, 2: password verification
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [userStats, setUserStats] = useState({
    boardCount: 0,
    collaboratorCount: 0,
    createdAt: null
  });

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser(currentUser);
      setProfileData({
        displayName: currentUser.displayName || '',
        email: currentUser.email || ''
      });
      fetchUserStats(currentUser.uid);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const fetchUserStats = async (userId) => {
    try {
      const response = await axios.get(`https://canvasconnect-fcch.onrender.com/api/boards/user/${userId}`);
      const boards = response.data;
      
      setUserStats({
        boardCount: boards.length,
        collaboratorCount: boards.reduce((acc, board) => acc + (board.collaborators?.length || 0), 0),
        createdAt: user?.metadata?.creationTime
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await updateProfile(user, {
        displayName: profileData.displayName
      });
      
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match.');
      setIsLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      setIsLoading(false);
      return;
    }

    try {
      // Re-authenticate user before password change
      const credential = EmailAuthProvider.credential(user.email, passwordData.currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, passwordData.newPassword);
      
      setSuccess('Password updated successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      if (err.code === 'auth/wrong-password') {
        setError('Current password is incorrect.');
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountDeletion = async () => {
    if (deleteStep === 0) {
      setDeleteStep(1);
      return;
    }

    if (deleteStep === 1) {
      if (deleteConfirmText !== 'DELETE MY ACCOUNT') {
        setError('Please type "DELETE MY ACCOUNT" to confirm.');
        return;
      }
      setDeleteStep(2);
      return;
    }

    if (deleteStep === 2) {
      setIsLoading(true);
      setError('');

      try {
        // Re-authenticate user before account deletion
        const credential = EmailAuthProvider.credential(user.email, deletePassword);
        await reauthenticateWithCredential(user, credential);

        // Delete all user's boards and data from backend
        await axios.delete(`https://canvasconnect-fcch.onrender.com/api/user/${user.uid}/delete-all-data`);

        // Delete Firebase account
        await deleteUser(user);

        // Redirect to homepage with success message
        navigate('/?deleted=true');
      } catch (err) {
        if (err.code === 'auth/wrong-password') {
          setError('Password is incorrect.');
        } else if (err.response?.status === 404) {
          // Backend endpoint doesn't exist, but we can still delete the Firebase account
          console.warn('Backend deletion endpoint not found, proceeding with account deletion only');
          try {
            await deleteUser(user);
            navigate('/?deleted=true');
          } catch (deleteErr) {
            setError('Failed to delete account: ' + deleteErr.message);
          }
        } else {
          setError('Failed to delete account: ' + (err.message || 'Unknown error'));
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const cancelDeletion = () => {
    setDeleteStep(0);
    setDeletePassword('');
    setDeleteConfirmText('');
    setError('');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading account settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage your account and preferences</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Status Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 flex items-center space-x-2">
            <XCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-600 dark:text-green-400 flex items-center space-x-2">
            <CheckCircle className="w-5 h-5" />
            <span>{success}</span>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Account Overview */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Overview</h2>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{user.displayName || 'No name set'}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{userStats.boardCount}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Boards</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{userStats.collaboratorCount}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Collaborators</div>
                    </div>
                  </div>
                  
                  {userStats.createdAt && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>Member since {new Date(userStats.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Settings Forms */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Profile Information</span>
              </h2>
              
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Display Name</label>
                  <input
                    type="text"
                    value={profileData.displayName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, displayName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter your display name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email cannot be changed</p>
                </div>
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Update Profile</span>
                </button>
              </form>
            </div>

            {/* Password Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <Lock className="w-5 h-5" />
                <span>Change Password</span>
              </h2>
              
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                  <span>Update Password</span>
                </button>
              </form>
            </div>

            {/* Danger Zone - Account Deletion */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-red-200 dark:border-red-800 p-6">
              <h2 className="text-lg font-semibold text-red-900 dark:text-red-400 mb-4 flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5" />
                <span>Danger Zone</span>
              </h2>
              
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-red-900 dark:text-red-400 mb-2">Delete Account</h3>
                <p className="text-red-700 dark:text-red-300 text-sm mb-4">
                  This action will permanently delete your account and all associated data. This includes:
                </p>
                <ul className="text-red-700 dark:text-red-300 text-sm space-y-1 mb-4">
                  <li className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>All your boards and whiteboards ({userStats.boardCount} boards)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>Collaboration history and shared content</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Database className="w-4 h-4" />
                    <span>All drawings, notes, and project data</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>Profile information and account settings</span>
                  </li>
                </ul>
                <div className="bg-red-100 dark:bg-red-800/30 border border-red-300 dark:border-red-700 rounded p-3">
                  <p className="text-red-800 dark:text-red-300 text-sm font-semibold">
                    ⚠️ This action cannot be undone. All data will be permanently lost.
                  </p>
                </div>
              </div>

              {deleteStep === 0 && (
                <button
                  onClick={handleAccountDeletion}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete My Account</span>
                </button>
              )}

              {deleteStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-red-700 dark:text-red-400 mb-2">
                      Type "DELETE MY ACCOUNT" to confirm:
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-red-300 dark:border-red-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="DELETE MY ACCOUNT"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleAccountDeletion}
                      disabled={deleteConfirmText !== 'DELETE MY ACCOUNT'}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>Confirm Deletion</span>
                    </button>
                    <button
                      onClick={cancelDeletion}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {deleteStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-red-700 dark:text-red-400 mb-2">
                      Enter your password to confirm account deletion:
                    </label>
                    <input
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-red-300 dark:border-red-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Enter your password"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleAccountDeletion}
                      disabled={isLoading || !deletePassword}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      <span>Permanently Delete Account</span>
                    </button>
                    <button
                      onClick={cancelDeletion}
                      disabled={isLoading}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
