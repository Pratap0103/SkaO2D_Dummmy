import React, { useState, useEffect } from 'react';
import { Filter, Search, Clock, CheckCircle, Upload, X, Plus, Minus } from 'lucide-react';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';

const MakeInvoice = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterParty, setFilterParty] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [pendingData, setPendingData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [uniqueParties, setUniqueParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [brokerNames, setBrokerNames] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [billStatuses, setBillStatuses] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filteredRates, setFilteredRates] = useState([]);
  const [brokerRateMap, setBrokerRateMap] = useState({});
  const [rows, setRows] = useState([{ 
    id: 1, 
    size: '', 
    section: '', 
    qty: '', 
    rate: '', 
    saudaNo: '', 
    brokerName: '',
    filteredRates: []
  }]);

  const [formData, setFormData] = useState({
    billDate: '',
    billNo: '',
    billImage: '',
    cashDiscount: '',
    billStatus: '',
    partyName: ''
  });

  useEffect(() => {
    fetchData();
    fetchDropdownData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const timestamp = new Date().getTime();
      const response = await fetch(
        `https://script.google.com/macros/s/AKfycbyhWN2S6qnJm7RVQr5VpPfyKRxI8gks0xxgWh_reMVlpsWvLo0rfzvqVA34x2xkPsJm/exec?sheet=ORDER-INVOICE&timestamp=${timestamp}`
      );
      const json = await response.json();

      if (json.success && Array.isArray(json.data)) {
        const allData = json.data.slice(6).map((row, index) => ({
          id: index + 1,
          serialNumber: row[1],
          partyName: row[2],
          erpDoNo: row[3],
          transporterName: row[4],
          lrNumber: row[5],
          vehicleNumber: row[6],
          deliveryTerm: row[7],
          brandName: row[8],
          dispatchQty: row[9],
          planned7: row[41],
          actual7: row[42],
          billDate: row[45],
          billNo: row[46],
          billImage: row[47],
          size: row[48],
          section: row[49],
          qty: row[50],
          rate: row[51],
          cashDiscount: row[52],
          saudaNo: row[53],
          brokerName: row[54],
          billStatus: row[55]
        }));

        const pending = allData.filter(item =>
          item.planned7 && item.planned7.trim() !== '' &&
          (!item.actual7 || item.actual7.trim() === '')
        );

        const history = allData.filter(item =>
          item.planned7 && item.planned7.trim() !== '' &&
          item.actual7 && item.actual7.trim() !== ''
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

  const fetchDropdownData = async () => {
    try {
      const brokerResponse = await fetch(
        `https://script.google.com/macros/s/AKfycbyhWN2S6qnJm7RVQr5VpPfyKRxI8gks0xxgWh_reMVlpsWvLo0rfzvqVA34x2xkPsJm/exec?sheet=Sauda&id=1wbIPdsHBxTE7fnzgOiAxS4koFwNxzwdpgp59NRWsnoc`
      );
      const brokerJson = await brokerResponse.json();
      if (brokerJson.success) {
        const saudaData = brokerJson.data.slice(1);
        const uniqueBrokers = [...new Set(saudaData.map(row => row[3]))];
        setBrokerNames(uniqueBrokers.filter(b => b));
        
        const mapping = {};
        saudaData.forEach(row => {
          const broker = row[3];
          const rate = row[4];
          const saudaNo = row[1];
          
          if (broker && rate) {
            if (!mapping[broker]) {
              mapping[broker] = [];
            }
            mapping[broker].push({ rate, saudaNo });
          }
        });
        setBrokerRateMap(mapping);
      }

      const sizeResponse = await fetch(
        `https://script.google.com/macros/s/AKfycbyhWN2S6qnJm7RVQr5VpPfyKRxI8gks0xxgWh_reMVlpsWvLo0rfzvqVA34x2xkPsJm/exec?sheet=Main Master&id=1wbIPdsHBxTE7fnzgOiAxS4koFwNxzwdpgp59NRWsnoc`
      );
      const sizeJson = await sizeResponse.json();
      if (sizeJson.success) {
        const uniqueSizes = [...new Set(sizeJson.data.slice(1).map(row => row[2]))];
        setSizes(uniqueSizes.filter(s => s));
      }

      const statusResponse = await fetch(
        `https://script.google.com/macros/s/AKfycbyhWN2S6qnJm7RVQr5VpPfyKRxI8gks0xxgWh_reMVlpsWvLo0rfzvqVA34x2xkPsJm/exec?sheet=Main Master&id=1wbIPdsHBxTE7fnzgOiAxS4koFwNxzwdpgp59NRWsnoc`
      );
      const statusJson = await statusResponse.json();
      if (statusJson.success) {
        const uniqueStatuses = [...new Set(statusJson.data.slice(1).map(row => row[3]))];
        setBillStatuses(uniqueStatuses.filter(s => s));
      }
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      toast.error('Failed to load dropdown data');
    }
  };

  const handleRowBrokerChange = (rowId, broker) => {
    setRows(prev => prev.map(row => {
      if (row.id === rowId) {
        const filteredRates = broker && brokerRateMap[broker] ? brokerRateMap[broker] : [];
        return {
          ...row,
          brokerName: broker,
          rate: '',
          saudaNo: '',
          filteredRates: filteredRates
        };
      }
      return row;
    }));
  };

  const handleRowRateChange = (rowId, selectedRate) => {
  setRows(prev => prev.map(row => {
    if (row.id === rowId) {
      // Convert both values to strings for consistent comparison
      const selectedRateStr = selectedRate.toString();
      const foundRate = row.filteredRates.find(r => r.rate.toString() === selectedRateStr);
      
      return {
        ...row,
        rate: selectedRate,
        saudaNo: foundRate ? foundRate.saudaNo : ''
      };
    }
    return row;
  }));
};

  const handleRowInputChange = (rowId, field, value) => {
    setRows(prev => prev.map(row => {
      if (row.id === rowId) {
        return {
          ...row,
          [field]: value
        };
      }
      return row;
    }));
  };

  const handleAddRow = () => {
    const newRow = { 
      id: Date.now(), 
      size: '', 
      section: '', 
      qty: '', 
      rate: '', 
      saudaNo: '', 
      brokerName: '',
      filteredRates: []
    };
    setRows(prev => [...prev, newRow]);
  };

  const handleRemoveRow = (id) => {
    if (rows.length > 1) {
      setRows(prev => prev.filter(row => row.id !== id));
    }
  };

  const handleOpenModal = (item) => {
    setCurrentItem(item);
    setFormData({
      billDate: item.billDate || '',
      billNo: item.billNo || '',
      billImage: item.billImage || '',
      cashDiscount: item.cashDiscount || '',
      billStatus: item.billStatus || '',
      partyName: item.partyName || ''
    });
    
    // Reset rows to initial state
    setRows([{ 
      id: 1, 
      size: item.size || '', 
      section: item.section || '', 
      qty: item.qty || '', 
      rate: item.rate || '', 
      saudaNo: item.saudaNo || '', 
      brokerName: item.brokerName || '',
      filteredRates: item.brokerName && brokerRateMap[item.brokerName] ? brokerRateMap[item.brokerName] : []
    }]);
    
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentItem(null);
    setFormData({
      billDate: '',
      billNo: '',
      billImage: '',
      cashDiscount: '',
      billStatus: '',
      partyName: ''
    });
    setRows([{ 
      id: 1, 
      size: '', 
      section: '', 
      qty: '', 
      rate: '', 
      saudaNo: '', 
      brokerName: '',
      filteredRates: []
    }]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setFormData(prev => ({
        ...prev,
        billImage: file
      }));
    } else {
      toast.error('Please upload an image file');
    }
  };

  const uploadImageToDrive = async (file) => {
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      const base64Data = await new Promise((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result.split(',')[1];
          resolve(result);
        };
        reader.onerror = () => {
          reject(new Error('Failed to read file'));
        };
      });

      const uploadResponse = await fetch(
        'https://script.google.com/macros/s/AKfycbyhWN2S6qnJm7RVQr5VpPfyKRxI8gks0xxgWh_reMVlpsWvLo0rfzvqVA34x2xkPsJm/exec',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            action: 'uploadFile',
            fileName: `Invoice_${currentItem.erpDoNo}_${Date.now()}.jpg`,
            base64Data: base64Data,
            mimeType: file.type,
            folderId: '1H4H9qAaXYavUE1d3PJ9vIRfDZT85A-4U'
          })
        }
      );

      const result = await uploadResponse.json();

      if (!result.success) {
        console.error('Upload error:', result.error);
        toast.error('Failed to upload image to Google Drive');
        return { success: false, error: result.error };
      }

      return result;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
      return { success: false, error: 'Failed to upload image' };
    }
  };

  const handleSubmitInvoice = async () => {
    // Validate basic form data
    if (!formData.billDate || !formData.billNo || !formData.billStatus) {
      toast.error('Please fill all required fields');
      return;
    }

    // Validate at least one row has complete data
    const validRows = rows.filter(row => 
      row.size && row.section && row.qty && row.rate && row.saudaNo
    );

    if (validRows.length === 0) {
      toast.error('Please complete at least one row in Size & Rate Details');
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = '';
      if (formData.billImage instanceof File) {
        const uploadResult = await uploadImageToDrive(formData.billImage);
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Failed to upload image');
        }
        imageUrl = uploadResult.fileUrl;
      } else if (formData.billImage) {
        imageUrl = formData.billImage;
      }

      const allInvoiceNumbers = [...pendingData, ...historyData]
        .map(item => item.billNo)
        .filter(billNo => billNo && billNo.startsWith('IN-'))
        .map(billNo => parseInt(billNo.replace('IN-', '')))
        .filter(num => !isNaN(num));

      const highestNumber = allInvoiceNumbers.length > 0 ? Math.max(...allInvoiceNumbers) : 0;
      const nextInvoiceNumber = `IN-${String(highestNumber + 1).padStart(3, '0')}`;

      // Use data from the first valid row for the main submission
      const firstRow = validRows[0];

      const updateResponse = await fetch(
        'https://script.google.com/macros/s/AKfycbyhWN2S6qnJm7RVQr5VpPfyKRxI8gks0xxgWh_reMVlpsWvLo0rfzvqVA34x2xkPsJm/exec',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            sheetId: '1wbIPdsHBxTE7fnzgOiAxS4koFwNxzwdpgp59NRWsnoc',
            sheetName: 'INVOICE-DELIVERY',
            action: 'update',
            rowIndex: currentItem.id + 6,
            columnData: JSON.stringify({
              'A': new Date().toISOString(),
              'B': nextInvoiceNumber,
              'C': currentItem.partyName,
              'D': firstRow.saudaNo,
              'E': currentItem.erpDoNo,
              'F': formData.billDate,
              'G': formData.billNo,
              'H': imageUrl,
              'I': currentItem.deliveryTerm,
              'J': currentItem.transporterName,
              'K': currentItem.vehicleNumber,
              'L': currentItem.lrNumber,
              'M': formData.billStatus,
              'N': firstRow.size,
              'O': firstRow.section,
              'P': firstRow.qty,
              'Q': firstRow.rate,
              'R': formData.cashDiscount
            })
          })
        }
      );

      const updateResult = await updateResponse.json();
      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Failed to update Google Sheet');
      }

      toast.success(`Invoice ${nextInvoiceNumber} submitted successfully!`);
      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error submitting invoice data:', error);
      toast.error(`Failed to submit invoice data: ${error.message}`);
    } finally {
      setIsSubmitting(false);
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
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Create Invoice</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Serial Number</label>
                  <input
                    type="text"
                    value={currentItem?.serialNumber || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Party Name</label>
                  <input
                    type="text"
                    value={currentItem?.partyName || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ERP DO No.</label>
                  <input
                    type="text"
                    value={currentItem?.erpDoNo || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    readOnly
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Billing Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="billDate"
                    value={formData.billDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bill No <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="billNo"
                    value={formData.billNo}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bill Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="billStatus"
                    value={formData.billStatus}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Status</option>
                    {billStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cash Discount</label>
                  <input
                    type="number"
                    name="cashDiscount"
                    value={formData.cashDiscount}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bill Image</label>
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
                      <Upload size={16} className="mr-2" />
                      Upload Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                    {formData.billImage && (
                      <span className="text-sm text-gray-600">
                        {formData.billImage instanceof File ? formData.billImage.name : 'Image uploaded'}
                      </span>
                    )}
                  </div>
                  
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">Size & Rate Details</h3>
                  <button 
                    onClick={handleAddRow}
                    className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Plus size={16} className="mr-1" />
                    Add
                  </button>
                </div>

                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Broker Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sauda No.</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {rows.map((row) => (
                        <tr key={row.id}>
                          <td className="px-4 py-3">
                            <select
                              value={row.brokerName}
                              onChange={(e) => handleRowBrokerChange(row.id, e.target.value)}
                              className="w-full px-2 py-1 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select Broker</option>
                              {brokerNames.map(broker => (
                                <option key={broker} value={broker}>{broker}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={row.size}
                              onChange={(e) => handleRowInputChange(row.id, 'size', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required
                            >
                              <option value="">Select Size</option>
                              {sizes.map(size => (
                                <option key={size} value={size}>{size}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={row.section}
                              onChange={(e) => handleRowInputChange(row.id, 'section', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={row.qty}
                              onChange={(e) => handleRowInputChange(row.id, 'qty', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={row.rate}
                              onChange={(e) => handleRowRateChange(row.id, e.target.value)}
                              className="w-full px-2 py-1 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required
                            >
                              <option value="">Select Rate</option>
                              {row.filteredRates.map((item, index) => (
                                <option key={index} value={item.rate}>{item.rate}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={row.saudaNo}
                              readOnly
                              className="w-full px-2 py-1 border border-gray-200 rounded bg-gray-100"
                              required
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button 
                              onClick={() => handleRemoveRow(row.id)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                              disabled={rows.length <= 1}
                            >
                              <Minus size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitInvoice}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center min-w-[120px]"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  'Submit'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Make Invoice</h1>
      </div>

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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LR Number</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Term</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dispatch Qty</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gate In </th>
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
                              Invoice
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.serialNumber}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.partyName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.erpDoNo}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.transporterName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.lrNumber}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.deliveryTerm}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.brandName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.dispatchQty}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.planned7}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredPendingData.length === 0 && !loading && (
                    <div className="px-6 py-12 text-center">
                      <p className="text-gray-500">No pending invoice records found.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ERP DO No.</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill No</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill Image</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredHistoryData.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleOpenModal(item)}
                              className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                            >
                              Edit
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.serialNumber}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.actual7 ? new Date(item.actual7).toLocaleString() : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.partyName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.erpDoNo}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.brandName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.billDate ? new Date(item.billDate).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.billNo}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className={`px-2 py-1 text-xs rounded-full ${item.billStatus === 'Paid'
                              ? 'bg-green-100 text-green-800'
                              : item.billStatus === 'Pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                              }`}>
                              {item.billStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.billImage ? (
                              <a
                                href={item.billImage}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-800"
                              >
                                View
                              </a>
                            ) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredHistoryData.length === 0 && !loading && (
                    <div className="px-6 py-12 text-center">
                      <p className="text-gray-500">No invoice history found.</p>
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

export default MakeInvoice;