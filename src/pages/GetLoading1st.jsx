import React, { useState, useEffect } from 'react';
import { Filter, Search, Clock, CheckCircle } from 'lucide-react';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const GetLoading1st = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterParty, setFilterParty] = useState('all');
  const [remarks, setRemarks] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [pendingData, setPendingData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [uniqueParties, setUniqueParties] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Adding timestamp to URL to prevent caching
      const timestamp = new Date().getTime();
      const response = await fetch(
        `https://script.google.com/macros/s/AKfycbyhWN2S6qnJm7RVQr5VpPfyKRxI8gks0xxgWh_reMVlpsWvLo0rfzvqVA34x2xkPsJm/exec?sheet=ORDER-INVOICE&timestamp=${timestamp}`
      );
      const json = await response.json();

      if (json.success && Array.isArray(json.data)) {
        const allData = json.data.slice(6).map((row, index) => ({
          id: index + 1,
          serialNumber: row[1],    // Column A
          partyName: row[2],       // Column C
          erpDoNo: row[3],         // Column D
          transporterName: row[4], // Column E
          lrNumber: row[5],        // Column F
          vehicleNumber: row[6],   // Column G
          deliveryTerm: row[7],    // Column H
          brandName: row[8],       // Column I
          dispatchQty: row[9],     // Column J
          planned3: row[18],       // Column S - Planned3
          actual3: row[19],        // Column T - Actual3
          loadingStatus1: row[21], // Column V - Loading Status1
          remarks: row[17]         // Column R - Remarks
        }));

        // Filter data based on conditions
        const pending = allData.filter(item =>
          item.planned3 && !item.actual3
        );
        const history = allData.filter(item =>
          item.planned3 && item.actual3
        );

        setPendingData(pending);
        setHistoryData(history);
        setUniqueParties([...new Set(allData.map(item => item.partyName))]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRemarksChange = (id, value) => {
    setRemarks(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleOpenModal = (item) => {
    setCurrentItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentItem(null);
  };

const handleSubmitLoading1st = async (id) => {
  const currentDateTime = new Date().toLocaleString('en-GB', {
    timeZone: 'Asia/Kolkata',
  });

  try {
    const response = await fetch(
      'https://script.google.com/macros/s/AKfycbyhWN2S6qnJm7RVQr5VpPfyKRxI8gks0xxgWh_reMVlpsWvLo0rfzvqVA34x2xkPsJm/exec',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          sheetId: '1wbIPdsHBxTE7fnzgOiAxS4koFwNxzwdpgp59NRWsnoc',
          sheetName: 'ORDER-INVOICE',
          action: 'update',
          rowIndex: (id + 6).toString(),
          columnData: JSON.stringify({
            T: currentDateTime,                             // Actual3
            V: currentItem.loadingStatus1 || 'complete',    // Loading Status1
            W: remarks[id] || ''                            // Remarks
          }),
        }),
      }
    );

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to update Google Sheet');
    }

    toast.success('Loading status updated successfully!');
    fetchData();
    handleCloseModal();
  } catch (error) {
    console.error('Error updating loading status:', error);
    toast.error('Failed to update loading status');
  }
};


  const filteredPendingData = pendingData.filter(item => {
    const matchesSearch = item.partyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.erpDoNo?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesParty = filterParty === 'all' || item.partyName === filterParty;
    return matchesSearch && matchesParty;
  });

  const filteredHistoryData = historyData.filter(item => {
    const matchesSearch = item.partyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.erpDoNo?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesParty = filterParty === 'all' || item.partyName === filterParty;
    return matchesSearch && matchesParty;
  });

  return (
    <div className="space-y-6">
      {/* Modal */}
      {isModalOpen && currentItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-indigo-600 p-4 text-white">
              <h2 className="text-xl font-bold">Loading 1st Details</h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Serial No</label>
                  <p className="mt-1 text-sm font-medium">{currentItem.serialNumber}</p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Party Name</label>
                  <p className="mt-1 text-sm font-medium">{currentItem.partyName}</p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Transporter</label>
                  <p className="mt-1 text-sm font-medium">{currentItem.transporterName}</p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle Number</label>
                  <p className="mt-1 text-sm font-medium">{currentItem.vehicleNumber}</p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</label>
                  <p className="mt-1 text-sm font-medium">{currentItem.brandName}</p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Dispatch Qty</label>
                  <p className="mt-1 text-sm font-medium">{currentItem.dispatchQty}</p>
                </div>
              </div>


              <div className="pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={currentItem.loadingStatus1 || ''}
                  onChange={(e) => setCurrentItem({
                    ...currentItem,
                    loadingStatus1: e.target.value
                  })}
                  className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Status</option>
                  <option value="pending">Pending</option>
                  <option value="complete">Complete</option>
                </select>
              </div>


            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSubmitLoading1st(currentItem.id)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                Submit Loading
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Get Loading 1st</h1>
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
              className={`py-4 px-6 font-medium text-sm border-b-2 ${activeTab === 'pending'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              onClick={() => setActiveTab('pending')}
            >
              <Clock size={16} className="inline mr-2" />
              Pending ({filteredPendingData.length})
            </button>
            <button
              className={`py-4 px-6 font-medium text-sm border-b-2 ${activeTab === 'history'
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
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="text-gray-600 ml-3">Loading data...</span>
            </div>
          ) : (
            <>
              {activeTab === 'pending' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ERP DO No.</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transporter Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle Number</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dispatch Qty</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredPendingData.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleOpenModal(item)}
                              className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                            >
                              Record Loading
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.serialNumber}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.partyName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.erpDoNo}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.transporterName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.vehicleNumber}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.brandName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.dispatchQty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredPendingData.length === 0 && !loading && (
                    <div className="px-6 py-12 text-center">
                      <p className="text-gray-500">No pending loading 1st records found.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loading Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ERP DO No.</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle Number</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dispatch Qty</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredHistoryData.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.serialNumber}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.actual3 ? new Date(item.actual3).toLocaleString() : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.partyName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.erpDoNo}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.vehicleNumber}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.brandName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.dispatchQty}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.loadingStatus1 === 'complete' ? (
                              <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Complete</span>
                            ) : (
                              <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Pending</span>
                            )}
                          </td>
                          
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredHistoryData.length === 0 && !loading && (
                    <div className="px-6 py-12 text-center">
                      <p className="text-gray-500">No historical loading 1st records found.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GetLoading1st;