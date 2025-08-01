import React, { useState, useEffect } from 'react';
import { Filter, Search, Clock, CheckCircle } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useDataStore from '../store/dataStore';
import toast from 'react-hot-toast';

const GetOut = () => {
  const { user } = useAuthStore();
  const { getFilteredData, updateGetOut } = useDataStore();
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterParty, setFilterParty] = useState('all');
  const [selectedItems, setSelectedItems] = useState({});
  const [getOutStatus, setGetOutStatus] = useState({});

  const invoiceData = getFilteredData('invoiceData', user);
  const getOutData = getFilteredData('getOutData', user);

  // Initialize get out data from completed invoice data
  useEffect(() => {
    const completedInvoiceData = invoiceData.filter(item => item.invoiceCompleted);
    completedInvoiceData.forEach(invoiceItem => {
      const existsInGetOut = getOutData.find(getOutItem => getOutItem.id === invoiceItem.id);
      if (!existsInGetOut) {
        // Add to get out data
        useDataStore.getState().getOutData.push({
          ...invoiceItem,
          getOutCompleted: false,
          getOutStatus: ''
        });
      }
    });
  }, [invoiceData]);

  const pendingData = getOutData.filter(item => !item.getOutCompleted);
  const historyData = getOutData.filter(item => item.getOutCompleted);

  const handleCheckboxChange = (id) => {
    setSelectedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleStatusChange = (id, status) => {
    setGetOutStatus(prev => ({
      ...prev,
      [id]: status
    }));
  };

  const handleSubmitGetOut = (id) => {
    const status = getOutStatus[id];
    if (!status) {
      toast.error('Please select get out status');
      return;
    }
    
    updateGetOut(id, status);
    toast.success('Get out status updated successfully!');
    setSelectedItems(prev => ({ ...prev, [id]: false }));
    setGetOutStatus(prev => ({ ...prev, [id]: '' }));
  };

  const filteredPendingData = pendingData.filter(item => {
    const matchesSearch = item.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.erpDoNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesParty = filterParty === 'all' || item.partyName === filterParty;
    return matchesSearch && matchesParty;
  });

  const filteredHistoryData = historyData.filter(item => {
    const matchesSearch = item.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.erpDoNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesParty = filterParty === 'all' || item.partyName === filterParty;
    return matchesSearch && matchesParty;
  });

  const uniqueParties = [...new Set(getOutData.map(item => item.partyName))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Get Out</h1>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex flex-1 max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search by party name or DO number..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Filter size={16} className="text-gray-500" />
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={filterParty}
            onChange={(e) => setFilterParty(e.target.value)}
          >
            <option value="all">All Parties</option>
            {uniqueParties.map(party => (
              <option key={party} value={party}>{party}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              className={`py-4 px-6 font-medium text-sm border-b-2 ${
                activeTab === 'pending'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('pending')}
            >
              <Clock size={16} className="inline mr-2" />
              Pending ({filteredPendingData.length})
            </button>
            <button
              className={`py-4 px-6 font-medium text-sm border-b-2 ${
                activeTab === 'history'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('history')}
            >
              <CheckCircle size={16} className="inline mr-2" />
              History ({filteredHistoryData.length})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'pending' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ERP DO No.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transporter Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LR Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Term</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Billing Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cash Discount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPendingData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedItems[item.id] || false}
                          onChange={() => handleCheckboxChange(item.id)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={getOutStatus[item.id] || ''}
                          onChange={(e) => handleStatusChange(item.id, e.target.value)}
                          disabled={!selectedItems[item.id]}
                          className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                        >
                          <option value="">Select Status</option>
                          <option value="Completed">Completed</option>
                          <option value="Pending">Pending</option>
                          <option value="Delayed">Delayed</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.invoiceNo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.serialNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.partyName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.erpDoNo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.transporterName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.lrNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.vehicleNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.deliveryTerm}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.billingDate ? new Date(item.billingDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.billNo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          item.billStatus === 'Paid' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.billStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.cashDiscount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredPendingData.length === 0 && (
                <div className="px-6 py-12 text-center">
                  <p className="text-gray-500">No pending get out records found.</p>
                </div>
              )}
              {filteredPendingData.length > 0 && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => {
                      Object.keys(selectedItems).forEach(id => {
                        if (selectedItems[id] && getOutStatus[id]) {
                          handleSubmitGetOut(parseInt(id));
                        }
                      });
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Submit Selected
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ERP DO No.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transporter Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LR Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Term</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Billing Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cash Discount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredHistoryData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          item.getOutStatus === 'Completed' 
                            ? 'bg-green-100 text-green-800' 
                            : item.getOutStatus === 'Delayed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.getOutStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.invoiceNo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.serialNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.partyName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.erpDoNo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.transporterName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.lrNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.vehicleNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.deliveryTerm}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.billingDate ? new Date(item.billingDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.billNo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          item.billStatus === 'Paid' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.billStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.cashDiscount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredHistoryData.length === 0 && (
                <div className="px-6 py-12 text-center">
                  <p className="text-gray-500">No get out history found.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GetOut;