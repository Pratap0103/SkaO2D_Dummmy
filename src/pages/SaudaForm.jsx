import React, { useState, useEffect } from 'react';
import { Plus, X, Filter, Search, Clock, CheckCircle } from 'lucide-react';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const SaudaForm = () => {
  const { user } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBrand, setFilterBrand] = useState('all');
  const [activeTab, setActiveTab] = useState('pending');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saudaData, setSaudaData] = useState([]);

  const [formData, setFormData] = useState({
    dateOfSauda: '',
    partyName: '',
    rate: '',
    brandName: '',
    totalQuantity: '',
    remark: '',
    partyWhatsApp: '',
    contactPersonName: '',
    pendingQty: 'Pending' // Default to Pending
  });

  // Fetch data directly from Google Sheets
  const fetchSaudaData = async () => {
    try {
      setIsLoading(true);
      const timestamp = new Date().getTime();

      const response = await fetch(
        `https://script.google.com/macros/s/AKfycbyhWN2S6qnJm7RVQr5VpPfyKRxI8gks0xxgWh_reMVlpsWvLo0rfzvqVA34x2xkPsJm/exec?sheet=sauda&t=${timestamp}`
      );

      const result = await response.json();

      if (result.success && result.data) {
        // ✅ Skip first 6 rows, start from row 7
        const dataRows = result.data.slice(5).filter(row => row.length > 0);

        const transformedData = dataRows.map((row, index) => {
          const pendingQty = row[12]?.trim() || 'Pending'; // Column M (12th index)

          return {
            id: index + 1,
            timestamp: row[0] || '',              // Column A
            saudaNumber: row[1] || 'aaaa',        // Column B
            dateOfSauda: row[2] || '',            // Column C
            partyName: row[3] || '',              // Column D
            rate: row[4] || '',                   // Column E
            brandName: row[5] || '',              // Column F
            totalQuantity: row[6] || '',          // Column G
            remark: row[7] || '',                 // Column H
            partyWhatsApp: row[8] || '',          // Column I
            contactPersonName: row[9] || '',      // Column J
            pendingQty: pendingQty,               // Column M
            completed: pendingQty === 'Complete'  // Boolean flag
          };
        });

        setSaudaData(transformedData);
      }
    } catch (error) {
      console.error('Error fetching sauda data:', error);
      toast.error('Failed to load sauda data');
    } finally {
      setIsLoading(false);
    }
  };


  // Auto-refresh data every 30 seconds
  useEffect(() => {
    fetchSaudaData();
    const interval = setInterval(fetchSaudaData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const postToGoogleSheet = async (data) => {
    try {
      // Get last used sauda number
      const existingSaudaNumbers = saudaData
        .map((item) => item.saudaNumber)
        .filter(Boolean)
        .map((sn) => parseInt(sn?.split('-')[1]))
        .filter((num) => !isNaN(num));

      const lastNumber = existingSaudaNumbers.length > 0 ? Math.max(...existingSaudaNumbers) : 0;
      const saudaNumber = `SN-${String(lastNumber + 1).padStart(3, '0')}`;
      // Prepare row data according to column structure
      const rowData = [
        new Date().toISOString(), // A: Timestamp
        saudaNumber,              // B: Sauda Number
        data.dateOfSauda,         // C: Date Of Sauda
        data.partyName,           // D: Broker Name
        data.rate,               // E: Rate
        data.brandName,           // F: Brand Name
        data.totalQuantity,       // G: Total Quantity (Ton)
        data.remark || '',        // H: Remark
        data.partyWhatsApp,       // I: Party WhatsApp Number
        data.contactPersonName,   // J: Contact Person Name
        '',                       // K: Empty
        '',                       // L: Empty

      ];

      const formData = new URLSearchParams();
      formData.append('sheetName', 'Sauda');
      formData.append('action', 'insert');
      formData.append('rowData', JSON.stringify(rowData));

      const response = await fetch('https://script.google.com/macros/s/AKfycbyhWN2S6qnJm7RVQr5VpPfyKRxI8gks0xxgWh_reMVlpsWvLo0rfzvqVA34x2xkPsJm/exec', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to save to Google Sheets');
      }

      return { success: true, saudaNumber };
    } catch (error) {
      console.error('Google Sheets Error:', error);
      throw new Error('Failed to save to Google Sheets');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { saudaNumber } = await postToGoogleSheet(formData);

      toast.success(`Sauda ${saudaNumber} added successfully!`);
      setFormData({
        dateOfSauda: '',
        partyName: '',
        rate: '',
        brandName: '',
        totalQuantity: '',
        remark: '',
        partyWhatsApp: '',
        contactPersonName: '',
        pendingQty: 'Pending'
      });
      setShowModal(false);

      // Refresh data after successful submission
      fetchSaudaData();
    } catch (error) {
      console.error('Submission Error:', error);
      toast.error(error.message || 'Failed to add sauda');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter data based on tab selection
  const filteredPendingData = saudaData.filter(item => item.pendingQty === 'Pending');
  const filteredHistoryData = saudaData.filter(item => item.pendingQty === 'Complete');

  const currentTabData = activeTab === 'pending' ? filteredPendingData : filteredHistoryData;

  const filteredData = currentTabData.filter(item => {
    const matchesSearch = item.partyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brandName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = filterBrand === 'all' || item.brandName === filterBrand;
    return matchesSearch && matchesBrand;
  });

  const uniqueBrands = [...new Set(saudaData.map(item => item.brandName).filter(Boolean))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Sauda Form</h1>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus size={16} className="mr-2" />
          New Sauda
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex flex-1 max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search by party name or brand..."
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
            value={filterBrand}
            onChange={(e) => setFilterBrand(e.target.value)}
          >
            <option value="all">All Brands</option>
            {uniqueBrands.map(brand => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              className={`py-4 px-6 font-medium text-sm border-b-2 ${activeTab === 'pending'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              onClick={() => setActiveTab('pending')}
            >
              <Clock size={16} className="inline mr-2" />
              Pending ({filteredPendingData.length})
            </button>
            <button
              className={`py-4 px-6 font-medium text-sm border-b-2 ${activeTab === 'history'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              onClick={() => setActiveTab('history')}
            >
              <CheckCircle size={16} className="inline mr-2" />
              Complete ({filteredHistoryData.length})
            </button>
          </nav>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="text-gray-600 ml-2">Loading data...</span>
          </div>
        )}

        {/* Table */}
        {!isLoading && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sauda No.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Of Sauda</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Broker Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Quantity (Ton)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remark</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party WhatsApp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Person</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.saudaNumber || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.dateOfSauda ? new Date(item.dateOfSauda).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.partyName || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{item.rate || '0'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.brandName || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.totalQuantity || '0'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.remark || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.partyWhatsApp || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.contactPersonName || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.pendingQty === 'Complete' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                        }`}>
                        {item.pendingQty || 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && filteredData.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500">No sauda records found.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-medium">New Sauda</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
                disabled={isSubmitting}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Of Sauda *</label>
                  <input
                    type="date"
                    name="dateOfSauda"
                    value={formData.dateOfSauda}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Broker Name *</label>
                  <input
                    type="text"
                    name="partyName"
                    value={formData.partyName}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rate *</label>
                  <input
                    type="number"
                    name="rate"
                    value={formData.rate}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name *</label>
                  <input
                    type="text"
                    name="brandName"
                    value={formData.brandName}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Quantity (Ton) *</label>
                  <input
                    type="number"
                    name="totalQuantity"
                    value={formData.totalQuantity}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Party WhatsApp Number *</label>
                  <input
                    type="tel"
                    name="partyWhatsApp"
                    value={formData.partyWhatsApp}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person Name *</label>
                  <input
                    type="text"
                    name="contactPersonName"
                    value={formData.contactPersonName}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remark</label>
                <textarea
                  name="remark"
                  value={formData.remark}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaudaForm;