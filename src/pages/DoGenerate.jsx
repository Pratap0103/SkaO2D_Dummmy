// import React, { useState, useEffect } from 'react';
// import { Plus, X, Filter, Search } from 'lucide-react';
// import useAuthStore from '../store/authStore';
// import toast from 'react-hot-toast';

// const DoGenerate = () => {
//   const { user } = useAuthStore();
//   const [showModal, setShowModal] = useState(false);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filterParty, setFilterParty] = useState('all');
//   const [statusFilter, setStatusFilter] = useState('all');
//   const [brandOptions, setBrandOptions] = useState([]);
//   const [deliveryTermOptions, setDeliveryTermOptions] = useState([]);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [doData, setDoData] = useState([]);
//   const [refreshData, setRefreshData] = useState(false);
//   const [loading, setLoading] = useState(true);

//   const [formData, setFormData] = useState({
//     partyName: '',
//     erpDoNo: '',
//     transporterName: '',
//     lrNumber: '',
//     vehicleNumber: '',
//     deliveryTerm: '',
//     brandName: '',
//     dispatchQty: ''
//   });

// useEffect(() => {
//   const fetchDOData = async () => {
//     setLoading(true); // start loading
//     try {
//       const res = await fetch(`https://script.google.com/macros/s/AKfycbyhWN2S6qnJm7RVQr5VpPfyKRxI8gks0xxgWh_reMVlpsWvLo0rfzvqVA34x2xkPsJm/exec?sheet=ORDER-INVOICE`);
//       const json = await res.json();
//       if (json.success && Array.isArray(json.data)) {
//         const parsed = json.data.slice(6).map((row, index) => ({
//           id: index + 1,
//           serialNumber: row[1],
//           partyName: row[2],
//           erpDoNo: row[3],
//           transporterName: row[4],
//           lrNumber: row[5],
//           vehicleNumber: row[6],
//           deliveryTerm: row[7],
//           brandName: row[8],
//           dispatchQty: row[9],
//           completed: false,
//         }));
//         setDoData(parsed);
//       } else {
//         setDoData([]);
//       }
//     } catch (err) {
//       console.error('Failed to fetch DO Data:', err);
//       toast.error('Failed to load DO data');
//     } finally {
//       setLoading(false); // end loading
//     }
//   };

//   fetchDOData();
// }, [refreshData]);

//   useEffect(() => { 
//     const fetchMasterData = async () => {
//       try {
//         const response = await fetch(
//           'https://script.google.com/macros/s/AKfycbyhWN2S6qnJm7RVQr5VpPfyKRxI8gks0xxgWh_reMVlpsWvLo0rfzvqVA34x2xkPsJm/exec?sheet=Main Master'
//         );
//         const data = await response.json();
//         if (data.success && data.data && data.data.length > 1) {
//           // Skip header row and get brand names from column A (index 0)
//           const brands = data.data.slice(1)
//             .map(row => row[0] ? row[0].toString().trim() : '')
//             .filter(brand => brand !== '');
          
//           // Skip header row and get delivery terms from column B (index 1)
//           const deliveryTerms = data.data.slice(1)
//             .map(row => row[1] ? row[1].toString().trim() : '')
//             .filter(term => term !== '');
          
//           // Update state with unique values
//           setBrandOptions([...new Set(brands.filter(b => b))]); // Filter out any empty strings
//           setDeliveryTermOptions([...new Set(deliveryTerms.filter(t => t))]); // Filter out any empty strings
//         }
//       } catch (error) {
//         console.error('Error fetching master data:', error);
//         // Initialize with empty arrays if fetch fails
//         setBrandOptions([]);
//         setDeliveryTermOptions([]);
//       }
//     };

//     fetchMasterData();
//   }, []);

//   const handleRefresh = () => {
//     setRefreshData(prev => !prev);
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

// const postToGoogleSheet = async (data) => {
//   try {
//     const response = await fetch(
//       'https://script.google.com/macros/s/AKfycbyhWN2S6qnJm7RVQr5VpPfyKRxI8gks0xxgWh_reMVlpsWvLo0rfzvqVA34x2xkPsJm/exec',
//       {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/x-www-form-urlencoded',
//         },
//         body: new URLSearchParams({
//           sheetId: '1wbIPdsHBxTE7fnzgOiAxS4koFwNxzwdpgp59NRWsnoc',
//           sheetName: 'ORDER-INVOICE',
//           action: 'insert',
//           rowData: JSON.stringify([
//             data.partyName,    // Column C
//             data.erpDoNo,      // Column D
//             data.transporterName, // Column E
//             data.lrNumber,     // Column F
//             data.vehicleNumber, // Column G
//             data.deliveryTerm, // Column H
//             data.brandName,    // Column I
//             data.dispatchQty   // Column J
//           ])
//         })
//       }
//     );

//     const result = await response.json();
//     if (!result.success) {
//       throw new Error(result.error || 'Failed to save to Google Sheet');
//     }
//     return result;
//   } catch (error) {
//     console.error('Error posting to Google Sheet:', error);
//     throw error;
//   }
// };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setIsSubmitting(true);
//     try {
//       await postToGoogleSheet(formData);
//       toast.success('DO generated and saved successfully!');
//       setFormData({
//         partyName: '',
//         erpDoNo: '',
//         transporterName: '',
//         lrNumber: '',
//         vehicleNumber: '',
//         deliveryTerm: '',
//         brandName: '',
//         dispatchQty: ''
//       });
//       setShowModal(false);
//       setRefreshData(prev => !prev); // Force re-fetch
//     } catch (error) {
//       console.error('Error:', error);
//       toast.error('Failed to save DO. Please try again.');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const filteredData = doData.filter(item => {
//     const matchesSearch = item.partyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       item.erpDoNo?.toLowerCase().includes(searchTerm.toLowerCase());
//     const matchesParty = filterParty === 'all' || item.partyName === filterParty;
//     const matchesStatus = statusFilter === 'all' ||
//       (statusFilter === 'pending' && !item.completed) ||
//       (statusFilter === 'complete' && item.completed);
//     return matchesSearch && matchesParty && matchesStatus;
//   });

//   const uniqueParties = [...new Set(doData.map(item => item.partyName))];

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <h1 className="text-2xl font-bold text-gray-800">DO Generate</h1>
//         <button
//           onClick={() => setShowModal(true)}
//           className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
//         >
//           <Plus size={16} className="mr-2" />
//           Generate DO
//         </button>
//       </div>

//       {/* Filter and Search */}
//       <div className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
//         <div className="flex flex-1 max-w-md">
//           <div className="relative w-full">
//             <input
//               type="text"
//               placeholder="Search by party name or DO number..."
//               className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//             />
//             <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//           </div>
//         </div>

//         <div className="flex items-center space-x-2">
//           <Filter size={16} className="text-gray-500" />
//           <select
//             className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
//             value={filterParty}
//             onChange={(e) => setFilterParty(e.target.value)}
//           >
//             <option value="all">All Parties</option>
//             {uniqueParties.map(party => (
//               <option key={party} value={party}>{party}</option>
//             ))}
//           </select>
//         </div>
//       </div>

//       {/* Table */}
//       <div className="bg-white rounded-lg shadow overflow-hidden">
//         {loading ? (
//     <div className="px-6 py-12 text-center">
//       <p className="text-gray-500">Loading DO data...</p>
//     </div>
//   ) : (
//     <>
//         <div className="overflow-x-auto">
//           <table className="min-w-full divide-y divide-gray-200">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party Name</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ERP DO No.</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transporter Name</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LR Number</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle Number</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Term</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand Name</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dispatch Qty</th>
                
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {filteredData.map((item) => (
//                 <tr key={item.id} className="hover:bg-gray-50">
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.serialNumber}</td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.partyName}</td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.erpDoNo}</td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.transporterName}</td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.lrNumber}</td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.vehicleNumber}</td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.deliveryTerm}</td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.brandName}</td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.dispatchQty}</td>
                  
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//         {filteredData.length === 0 && (
//           <div className="px-6 py-12 text-center">
//             <p className="text-gray-500">No DO records found.</p>
//           </div>
//         )}
//         </>
//   )}
//       </div>

//       {/* Modal */}
//       {showModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
//             <div className="flex justify-between items-center p-6 border-b">
//               <h3 className="text-lg font-medium">Generate DO</h3>
//               <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
//                 <X size={20} />
//               </button>
//             </div>
//             <form onSubmit={handleSubmit} className="p-6 space-y-4">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Party Name</label>
//                   <input
//                     type="text"
//                     name="partyName"
//                     value={formData.partyName}
//                     onChange={handleInputChange}
//                     className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                     required
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">ERP DO No.</label>
//                   <input
//                     type="text"
//                     name="erpDoNo"
//                     value={formData.erpDoNo}
//                     onChange={handleInputChange}
//                     className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                     required
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Transporter Name</label>
//                   <input
//                     type="text"
//                     name="transporterName"
//                     value={formData.transporterName}
//                     onChange={handleInputChange}
//                     className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                     required
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">LR Number</label>
//                   <input
//                     type="text"
//                     name="lrNumber"
//                     value={formData.lrNumber}
//                     onChange={handleInputChange}
//                     className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                     required
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
//                   <input
//                     type="text"
//                     name="vehicleNumber"
//                     value={formData.vehicleNumber}
//                     onChange={handleInputChange}
//                     className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                     required
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Term</label>
//                   <select
//                     name="deliveryTerm"
//                     value={formData.deliveryTerm}
//                     onChange={handleInputChange}
//                     className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                     required
//                   >
//                     <option value="">Select Delivery Term</option>
//                     {deliveryTermOptions.map((term, index) => (
//                       <option key={index} value={term}>{term}</option>
//                     ))}
//                   </select>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
//                   <select
//                     name="brandName"
//                     value={formData.brandName}
//                     onChange={handleInputChange}
//                     className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                     required
//                   >
//                     <option value="">Select Brand Name</option>
//                     {brandOptions.map((brand, index) => (
//                       <option key={index} value={brand}>{brand}</option>
//                     ))}
//                   </select>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Dispatch Qty</label>
//                   <input
//                     type="number"
//                     name="dispatchQty"
//                     value={formData.dispatchQty}
//                     onChange={handleInputChange}
//                     className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                     required
//                   />
//                 </div>
//               </div>
//               <div className="flex justify-end space-x-2 pt-4">
//                 <button
//                   type="button"
//                   onClick={() => setShowModal(false)}
//                   className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
//                   disabled={isSubmitting}
//                 >
//                   {isSubmitting ? 'Submitting...' : 'Submit'}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default DoGenerate;





import React, { useState, useEffect } from 'react';
import { Plus, X, Filter, Search } from 'lucide-react';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const DoGenerate = () => {
  const { user } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterParty, setFilterParty] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [brandOptions, setBrandOptions] = useState([]);
  const [deliveryTermOptions, setDeliveryTermOptions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [doData, setDoData] = useState([]);
  const [refreshData, setRefreshData] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    partyName: '',
    erpDoNo: '',
    transporterName: '',
    lrNumber: '',
    vehicleNumber: '',
    deliveryTerm: '',
    brandName: '',
    dispatchQty: ''
  });

  useEffect(() => {
    const fetchDOData = async () => {
      setLoading(true); // start loading
      try {
        const res = await fetch(`https://script.google.com/macros/s/AKfycbyhWN2S6qnJm7RVQr5VpPfyKRxI8gks0xxgWh_reMVlpsWvLo0rfzvqVA34x2xkPsJm/exec?sheet=ORDER-INVOICE`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const parsed = json.data.slice(6).map((row, index) => ({
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
            completed: false,
          }));
          setDoData(parsed);
        } else {
          setDoData([]);
        }
      } catch (err) {
        console.error('Failed to fetch DO Data:', err);
        toast.error('Failed to load DO data');
      } finally {
        setLoading(false); // end loading
      }
    };

    fetchDOData();
  }, [refreshData]);

  useEffect(() => { 
    const fetchMasterData = async () => {
      try {
        const response = await fetch(
          'https://script.google.com/macros/s/AKfycbyhWN2S6qnJm7RVQr5VpPfyKRxI8gks0xxgWh_reMVlpsWvLo0rfzvqVA34x2xkPsJm/exec?sheet=Main Master'
        );
        const data = await response.json();
        if (data.success && data.data && data.data.length > 1) {
          // Skip header row and get brand names from column A (index 0)
          const brands = data.data.slice(1)
            .map(row => row[0] ? row[0].toString().trim() : '')
            .filter(brand => brand !== '');
          
          // Skip header row and get delivery terms from column B (index 1)
          const deliveryTerms = data.data.slice(1)
            .map(row => row[1] ? row[1].toString().trim() : '')
            .filter(term => term !== '');
          
          // Update state with unique values
          setBrandOptions([...new Set(brands.filter(b => b))]); // Filter out any empty strings
          setDeliveryTermOptions([...new Set(deliveryTerms.filter(t => t))]); // Filter out any empty strings
        }
      } catch (error) {
        console.error('Error fetching master data:', error);
        // Initialize with empty arrays if fetch fails
        setBrandOptions([]);
        setDeliveryTermOptions([]);
      }
    };

    fetchMasterData();
  }, []);

  const handleRefresh = () => {
    setRefreshData(prev => !prev);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const postToGoogleSheet = async (data) => {
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
            action: 'insert',
            rowData: JSON.stringify([
              data.partyName,    // Column C
              data.erpDoNo,      // Column D
              data.transporterName, // Column E
              data.lrNumber,     // Column F
              data.vehicleNumber, // Column G
              data.deliveryTerm, // Column H
              data.brandName,    // Column I
              data.dispatchQty   // Column J
            ])
          })
        }
      );

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to save to Google Sheet');
      }
      return result;
    } catch (error) {
      console.error('Error posting to Google Sheet:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await postToGoogleSheet(formData);
      toast.success('DO generated and saved successfully!');
      setFormData({
        partyName: '',
        erpDoNo: '',
        transporterName: '',
        lrNumber: '',
        vehicleNumber: '',
        deliveryTerm: '',
        brandName: '',
        dispatchQty: ''
      });
      setShowModal(false);
      setRefreshData(prev => !prev); // Force re-fetch
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to save DO. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredData = doData.filter(item => {
    const matchesSearch = item.partyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.erpDoNo?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesParty = filterParty === 'all' || item.partyName === filterParty;
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'pending' && !item.completed) ||
      (statusFilter === 'complete' && item.completed);
    return matchesSearch && matchesParty && matchesStatus;
  });

  const uniqueParties = [...new Set(doData.map(item => item.partyName))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">DO Generate</h1>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus size={16} className="mr-2" />
          Generate DO
        </button>
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

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="text-gray-600 ml-2">Loading data...</span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ERP DO No.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transporter Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LR Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Term</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dispatch Qty</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.serialNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.partyName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.erpDoNo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.transporterName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.lrNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.vehicleNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.deliveryTerm}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.brandName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.dispatchQty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredData.length === 0 && !loading && (
              <div className="px-6 py-12 text-center">
                <p className="text-gray-500">No DO records found.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-medium">Generate DO</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Party Name</label>
                  <input
                    type="text"
                    name="partyName"
                    value={formData.partyName}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ERP DO No.</label>
                  <input
                    type="text"
                    name="erpDoNo"
                    value={formData.erpDoNo}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transporter Name</label>
                  <input
                    type="text"
                    name="transporterName"
                    value={formData.transporterName}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">LR Number</label>
                  <input
                    type="text"
                    name="lrNumber"
                    value={formData.lrNumber}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
                  <input
                    type="text"
                    name="vehicleNumber"
                    value={formData.vehicleNumber}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Term</label>
                  <select
                    name="deliveryTerm"
                    value={formData.deliveryTerm}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Select Delivery Term</option>
                    {deliveryTermOptions.map((term, index) => (
                      <option key={index} value={term}>{term}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
                  <select
                    name="brandName"
                    value={formData.brandName}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Select Brand Name</option>
                    {brandOptions.map((brand, index) => (
                      <option key={index} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dispatch Qty</label>
                  <input
                    type="number"
                    name="dispatchQty"
                    value={formData.dispatchQty}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
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

export default DoGenerate;