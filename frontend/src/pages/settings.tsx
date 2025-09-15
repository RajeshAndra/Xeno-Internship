import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import DashboardLayout from '../components/DashboardLayout';
import { User, Building, ShoppingBag, Bell, Shield, Key, Palette, Mail, Save, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('account');
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    marketing: false,
    orders: true,
    lowStock: true
  });
  const [shopifySettings, setShopifySettings] = useState({
    connected: false,
    storeName: '',
    apiKey: '',
    apiSecret: '',
    syncFrequency: 'hourly',
    autoSync: true
  });

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleSaveNotifications = () => {
    // In real app, this would call API
    console.log('Saving notifications:', notifications);
  };

  const handleConnectShopify = () => {
    // In real app, this would redirect to Shopify OAuth
    setShopifySettings(prev => ({ ...prev, connected: true, storeName: 'demo-store' }));
  };

  const handleDisconnectShopify = () => {
    setShopifySettings(prev => ({ 
      ...prev, 
      connected: false, 
      storeName: '',
      apiKey: '',
      apiSecret: ''
    }));
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return null;
  }

  const tabs = [
    { id: 'account', name: 'Account', icon: User },
    { id: 'shopify', name: 'Shopify', icon: ShoppingBag },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'billing', name: 'Billing', icon: Building }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account and application preferences</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Settings Navigation */}
          <div className="lg:w-64">
            <nav className="bg-white rounded-lg shadow-sm border p-4">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md mb-1 ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-3" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Settings Content */}
          <div className="flex-1">
            {activeTab === 'account' && (
              <div className="space-y-6">
                {/* Profile Information */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      <input
                        type="text"
                        defaultValue={user.first_name}
                        title="First Name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      <input
                        type="text"
                        defaultValue={user.last_name}
                        title="Last Name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                      <input
                        type="email"
                        defaultValue={user.email}
                        title="Email Address"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="mt-6">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center">
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </button>
                  </div>
                </div>

                {/* Organization */}
                {user.tenant && (
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Organization</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Company Name</label>
                        <p className="mt-1 text-sm text-gray-900">{user.tenant.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Subscription Plan</label>
                        <div className="flex items-center mt-1">
                          <span className="text-sm text-gray-900 capitalize">{user.tenant.subscription_plan}</span>
                          <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'shopify' && (
              <div className="space-y-6">
                {/* Shopify Connection */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Shopify Integration</h2>
                    <div className="flex items-center">
                      {shopifySettings.connected ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
                      )}
                      <span className={`text-sm font-medium ${
                        shopifySettings.connected ? 'text-green-700' : 'text-yellow-700'
                      }`}>
                        {shopifySettings.connected ? 'Connected' : 'Not Connected'}
                      </span>
                    </div>
                  </div>

                  {shopifySettings.connected ? (
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-md p-4">
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          <span className="text-sm text-green-700">
                            Connected to store: <strong>{shopifySettings.storeName}</strong>
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Sync Frequency</label>
                          <select
                            value={shopifySettings.syncFrequency}
                            onChange={(e) => setShopifySettings(prev => ({ ...prev, syncFrequency: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            title="Sync Frequency"
                            aria-label="Sync Frequency"
                          >
                            <option value="realtime">Real-time</option>
                            <option value="hourly">Every hour</option>
                            <option value="daily">Daily</option>
                            <option value="manual">Manual only</option>
                          </select>
                        </div>
                        <div className="flex items-end">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={shopifySettings.autoSync}
                              onChange={(e) => setShopifySettings(prev => ({ ...prev, autoSync: e.target.checked }))}
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Enable auto-sync</span>
                          </label>
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm">
                          Sync Now
                        </button>
                        <button 
                          onClick={handleDisconnectShopify}
                          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm"
                        >
                          Disconnect Store
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-gray-600">
                        Connect your Shopify store to start syncing products, orders, and customer data.
                      </p>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                        <div className="flex">
                          <AlertCircle className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-yellow-700">
                            <p className="font-medium">Setup Required</p>
                            <p>You'll need your Shopify store URL and API credentials to complete the connection.</p>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={handleConnectShopify}
                        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 flex items-center"
                      >
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        Connect Shopify Store
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Email Notifications</h3>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={notifications.email}
                          onChange={(e) => setNotifications(prev => ({ ...prev, email: e.target.checked }))}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-3 text-sm text-gray-700">General email notifications</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={notifications.orders}
                          onChange={(e) => setNotifications(prev => ({ ...prev, orders: e.target.checked }))}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-3 text-sm text-gray-700">New order alerts</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={notifications.lowStock}
                          onChange={(e) => setNotifications(prev => ({ ...prev, lowStock: e.target.checked }))}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-3 text-sm text-gray-700">Low stock warnings</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={notifications.marketing}
                          onChange={(e) => setNotifications(prev => ({ ...prev, marketing: e.target.checked }))}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-3 text-sm text-gray-700">Marketing and promotional emails</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Push Notifications</h3>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={notifications.push}
                        onChange={(e) => setNotifications(prev => ({ ...prev, push: e.target.checked }))}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm text-gray-700">Browser push notifications</span>
                    </label>
                  </div>
                  <div className="pt-4">
                    <button 
                      onClick={handleSaveNotifications}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Preferences
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Password</h3>
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm">
                        Change Password
                      </button>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Two-Factor Authentication</h3>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                        <div className="flex">
                          <Key className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0" />
                          <div className="text-sm text-yellow-700">
                            <p className="font-medium">Not Enabled</p>
                            <p>Add an extra layer of security to your account.</p>
                          </div>
                        </div>
                      </div>
                      <button className="mt-3 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm">
                        Enable 2FA
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Billing & Subscription</h2>
                <div className="space-y-6">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Professional Plan</h3>
                        <p className="text-sm text-gray-500">Unlimited stores and advanced analytics</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">$49</p>
                        <p className="text-sm text-gray-500">/month</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Billing History</h3>
                    <div className="bg-gray-50 rounded-md p-4">
                      <p className="text-sm text-gray-600">No billing history available</p>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm">
                      Update Payment Method
                    </button>
                    <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 text-sm">
                      Download Invoice
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;