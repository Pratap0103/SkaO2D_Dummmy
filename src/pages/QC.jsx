import React, { useState, useEffect } from 'react';
import { Filter, Search, Clock, CheckCircle, Upload } from 'lucide-react';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

// Import jsPDF - you need to install it: npm install jspdf
import jsPDF from 'jspdf';

const QC = () => {
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
  const [formData, setFormData] = useState({
    section: '',
    tagProper: '',
    typeOfMaterial: '',
    redNess: '',
    noRust: '',
    bundleCountNo: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          planned6: row[31],       // Column AF - Planned6
          actual6: row[32],       // Column AG - Actual6
          section: row[34],       // Column AI - Section
          tagProper: row[35],     // Column AJ - Tag Proper
          typeOfMaterial: row[36], // Column AK - Type Of Material
          redNess: row[37],       // Column AL - Red Ness
          noRust: row[38],        // Column AM - No Rust
          bundleCountNo: row[39], // Column AN - Bundle Count No.
          pdf: row[40]            // Column AO - PDF
        }));

        // Filter data based on conditions and brand names
        // Filter data based on conditions (removed brand name filter)
        const pending = allData.filter(item =>
          item.planned6 && item.planned6.trim() !== '' &&
          (!item.actual6 || item.actual6.trim() === '')
        );

        const history = allData.filter(item =>
          item.planned6 && item.planned6.trim() !== '' &&
          item.actual6 && item.actual6.trim() !== ''
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

  const handleOpenModal = (item) => {
    setCurrentItem(item);
    setFormData({
      section: item.section || '',
      tagProper: item.tagProper || '',
      typeOfMaterial: item.typeOfMaterial || '',
      redNess: item.redNess || '',
      noRust: item.noRust || '',
      bundleCountNo: item.bundleCountNo || ''
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentItem(null);
    setFormData({
      section: '',
      tagProper: '',
      typeOfMaterial: '',
      redNess: '',
      noRust: '',
      bundleCountNo: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generatePDF = async () => {
    try {
      const doc = new jsPDF();

      // Title
      doc.setFontSize(16);
      doc.text('QC Inspection Report', 105, 20, { align: 'center' });

      // Section 1 - General Info
      doc.setFontSize(12);
      doc.text(`LR NO.: ${currentItem.lrNo || 'N/A'}`, 20, 40);
      doc.text(`Brand Name: ${currentItem.brandName || 'N/A'}`, 20, 50);
      doc.text(`ERP DO No.: ${currentItem.erpDoNo || 'N/A'}`, 20, 60);
      doc.text(`Vehicle Number: ${currentItem.vehicleNumber || 'N/A'}`, 20, 70);
      doc.text(`Get in Detailed: ${currentItem.getInDetailed || 'N/A'}`, 20, 80);

      // Section 2 - QC Data
      doc.setFontSize(14);
      doc.text('QC Inspection Results', 20, 100);
      doc.setFontSize(12);
      doc.text(`Section: ${formData.section || 'N/A'}`, 20, 110);
      doc.text(`Bundle Count No.: ${formData.bundleCountNo || 'N/A'}`, 20, 120);
      doc.text(`Tag Proper: ${formData.tagProper || 'N/A'}`, 20, 130);
      doc.text(`Type Of Material: ${formData.typeOfMaterial || 'N/A'}`, 20, 140);
      doc.text(`Red Ness: ${formData.redNess || 'N/A'}`, 20, 150);
      doc.text(`No Rust: ${formData.noRust || 'N/A'}`, 20, 160);

      // Date & Signature
      const date = new Date().toLocaleString();
      doc.text(`Date: ${date}`, 20, 180);
      doc.text('Inspector Signature: ___________________', 20, 190);

      // PDF Output
      const pdfOutput = doc.output('datauristring');

      return {
        success: true,
        fileUrl: pdfOutput,
        fileName: `QC_Report_${currentItem.serialNumber || 'Unknown'}_${Date.now()}.pdf`
      };
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(`PDF Generation Error: ${error.message}`);
      return { success: false, error: error.message || 'Failed to generate PDF' };
    }
  };


  const uploadPDFToDrive = async (pdfResult) => {
    try {
      // Extract just the base64 data part
      const base64Data = pdfResult.fileUrl.split(',')[1];

      const uploadResponse = await fetch(
        'https://script.google.com/macros/s/AKfycbyhWN2S6qnJm7RVQr5VpPfyKRxI8gks0xxgWh_reMVlpsWvLo0rfzvqVA34x2xkPsJm/exec',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            action: 'uploadFile',
            fileName: pdfResult.fileName,
            base64Data: base64Data,
            mimeType: 'application/pdf',
            folderId: '1H4H9qAaXYavUE1d3PJ9vIRfDZT85A-4U'
          })
        }
      );

      const result = await uploadResponse.json();

      if (!result.success) {
        console.error('Upload error:', result.error);
        toast.error('Failed to upload PDF to Google Drive');
        return { success: false, error: result.error };
      }

      return result;
    } catch (error) {
      console.error('Error uploading PDF:', error);
      toast.error('Failed to upload PDF');
      return { success: false, error: 'Failed to upload PDF' };
    }
  };

  const handleSubmitQC = async () => {
    if (!formData.section || !formData.tagProper || !formData.typeOfMaterial ||
      !formData.redNess || !formData.noRust || !formData.bundleCountNo) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    const currentDateTime = new Date().toLocaleString('en-GB', {
      timeZone: 'Asia/Kolkata',
    });

    try {
      // Generate PDF
      const pdfResult = await generatePDF();
      if (!pdfResult.success) {
        throw new Error(pdfResult.error || 'Failed to generate PDF');
      }

      // Upload PDF to Google Drive
      const uploadResult = await uploadPDFToDrive(pdfResult);
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Failed to upload PDF to Google Drive');
      }

      // Update the Google Sheet
      const updateResponse = await fetch(
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
            rowIndex: currentItem.id + 6,
            columnData: JSON.stringify({
              'AG': currentDateTime,  // Column AG - Actual6
              'AI': formData.section, // Column AI - Section
              'AJ': formData.tagProper, // Column AJ - Tag Proper
              'AK': formData.typeOfMaterial, // Column AK - Type Of Material
              'AL': formData.redNess, // Column AL - Red Ness
              'AM': formData.noRust,  // Column AM - No Rust
              'AN': formData.bundleCountNo, // Column AN - Bundle Count No.
              'AO': uploadResult.fileUrl // Column AO - PDF URL
            })
          })
        }
      );

      const updateResult = await updateResponse.json();
      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Failed to update Google Sheet');
      }

      toast.success('QC data submitted successfully!');
      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error submitting QC data:', error);
      toast.error(`Failed to submit QC data: ${error.message}`);
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
      {/* Modal */}
      {isModalOpen && currentItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full sm:max-w-md max-h-screen overflow-y-auto">
            <div className="bg-indigo-600 p-4 text-white">
              <h2 className="text-xl font-bold">QC Details</h2>
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
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">ERP DO No.</label>
                  <p className="mt-1 text-sm font-medium">{currentItem.erpDoNo}</p>
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

              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Section *</label>
                  <input
                    type="text"
                    name="section"
                    value={formData.section}
                    onChange={handleInputChange}
                    className="mt-1 text-sm font-medium w-full border border-gray-300 rounded px-2 py-1"
                    placeholder="Enter section"
                  />
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Tag Proper *</label>
                  <input
                    type="text"
                    name="tagProper"
                    value={formData.tagProper}
                    onChange={handleInputChange}
                    className="mt-1 text-sm font-medium w-full border border-gray-300 rounded px-2 py-1"
                    placeholder="Enter tag proper"
                  />
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Type Of Material *</label>
                  <input
                    type="text"
                    name="typeOfMaterial"
                    value={formData.typeOfMaterial}
                    onChange={handleInputChange}
                    className="mt-1 text-sm font-medium w-full border border-gray-300 rounded px-2 py-1"
                    placeholder="Enter type of material"
                  />
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Red Ness *</label>
                  <input
                    type="text"
                    name="redNess"
                    value={formData.redNess}
                    onChange={handleInputChange}
                    className="mt-1 text-sm font-medium w-full border border-gray-300 rounded px-2 py-1"
                    placeholder="Enter red ness"
                  />
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">No Rust *</label>
                  <input
                    type="text"
                    name="noRust"
                    value={formData.noRust}
                    onChange={handleInputChange}
                    className="mt-1 text-sm font-medium w-full border border-gray-300 rounded px-2 py-1"
                    placeholder="Enter no rust"
                  />
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Bundle Count No. *</label>
                  <input
                    type="number"
                    name="bundleCountNo"
                    value={formData.bundleCountNo}
                    onChange={handleInputChange}
                    className="mt-1 text-sm font-medium w-full border border-gray-300 rounded px-2 py-1"
                    placeholder="Enter bundle count no."
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitQC}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center"
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
                  'Submit QC'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">QC</h1>
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
                              QC
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
                      <p className="text-gray-500">No pending QC records found.</p>
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">QC Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ERP DO No.</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle Number</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dispatch Qty</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tag Proper</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type Of Material</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Red Ness</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No Rust</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bundle Count No.</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PDF</th>
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
                            {item.actual6 ? new Date(item.actual6).toLocaleString() : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.partyName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.erpDoNo}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.vehicleNumber}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.brandName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.dispatchQty}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.section || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.tagProper || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.typeOfMaterial || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.redNess || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.noRust || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.bundleCountNo || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.pdf ? (
                              <a
                                href={item.pdf}
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
                      <p className="text-gray-500">No historical QC records found.</p>
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

export default QC;