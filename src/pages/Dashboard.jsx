import React from 'react';
import useAuthStore from '../store/authStore';
import useDataStore from '../store/dataStore';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  Package, 
  Truck, 
  Scale, 
  Receipt, 
  Users, 
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuthStore();
  const { getFilteredData } = useDataStore();

  // Get filtered data based on user role
  const saudaData = getFilteredData('saudaData', user);
  const doData = getFilteredData('doData', user);
  const gateInData = getFilteredData('gateInData', user);
  const invoiceData = getFilteredData('invoiceData', user);

  // Mock chart data
  const orderStatusData = [
    { name: 'Pending', value: 45, color: '#F59E0B' },
    { name: 'In Progress', value: 30, color: '#3B82F6' },
    { name: 'Completed', value: 80, color: '#10B981' },
    { name: 'Cancelled', value: 5, color: '#EF4444' }
  ];

  const logisticsData = [
    { month: 'Jan', gateIn: 120, gateOut: 115, delays: 5 },
    { month: 'Feb', gateIn: 135, gateOut: 130, delays: 8 },
    { month: 'Mar', gateIn: 148, gateOut: 145, delays: 3 },
    { month: 'Apr', gateIn: 162, gateOut: 158, delays: 7 },
    { month: 'May', gateIn: 175, gateOut: 170, delays: 4 },
    { month: 'Jun', gateIn: 188, gateOut: 185, delays: 2 }
  ];

  const performanceData = [
    { name: 'Staff Productivity', value: 85 },
    { name: 'Delivery Times', value: 92 },
    { name: 'Quality Score', value: 88 },
    { name: 'Customer Satisfaction', value: 94 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          Dashboard {user?.role !== 'admin' && '(My Data)'}
        </h1>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow p-6 flex items-start">
          <div className="p-3 rounded-full bg-blue-100 mr-4">
            <Package size={24} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Orders</p>
            <h3 className="text-2xl font-bold text-gray-800">{saudaData.length}</h3>
            <p className="text-xs text-green-600 mt-1">+12% from last month</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 flex items-start">
          <div className="p-3 rounded-full bg-green-100 mr-4">
            <Truck size={24} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">DO Generated</p>
            <h3 className="text-2xl font-bold text-gray-800">{doData.length}</h3>
            <p className="text-xs text-green-600 mt-1">+8% from last month</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 flex items-start">
          <div className="p-3 rounded-full bg-purple-100 mr-4">
            <Scale size={24} className="text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Gate In</p>
            <h3 className="text-2xl font-bold text-gray-800">{gateInData.length}</h3>
            <p className="text-xs text-amber-600 mt-1">5 pending today</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 flex items-start">
          <div className="p-3 rounded-full bg-amber-100 mr-4">
            <Receipt size={24} className="text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Invoices</p>
            <h3 className="text-2xl font-bold text-gray-800">{invoiceData.length}</h3>
            <p className="text-xs text-green-600 mt-1">₹2.5L revenue</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
            <Package size={20} className="mr-2 text-indigo-600" />
            Order Status Tracking
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
            <Truck size={20} className="mr-2 text-indigo-600" />
            Logistics Overview
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={logisticsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="gateIn" name="Gate In" fill="#4F46E5" />
                <Bar dataKey="gateOut" name="Gate Out" fill="#10B981" />
                <Bar dataKey="delays" name="Delays" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
            <Scale size={20} className="mr-2 text-indigo-600" />
            Weight & Quality Tracking
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={logisticsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="gateIn" name="Weight Processed" stroke="#4F46E5" />
                <Line type="monotone" dataKey="gateOut" name="Quality Passed" stroke="#10B981" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
            <TrendingUp size={20} className="mr-2 text-indigo-600" />
            Performance Metrics
          </h2>
          <div className="space-y-4">
            {performanceData.map((metric, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{metric.name}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full" 
                      style={{ width: `${metric.value}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{metric.value}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-6">Recent Activity</h2>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="flex items-start pb-4 border-b border-gray-100">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
                <CheckCircle size={20} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <p className="text-sm font-medium text-gray-900">Order #{1000 + item} processed</p>
                  <span className="text-xs text-gray-500">2h ago</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Gate in completed for Party ABC Ltd.
                </p>
                <div className="mt-2 flex items-center">
                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Completed</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;