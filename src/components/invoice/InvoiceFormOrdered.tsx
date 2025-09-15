import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft, MapPin, Truck, Calendar, Package, Home, User, Search } from 'lucide-react';
import { Invoice, Product } from '../../types/invoice';
import { generateProducts } from '../../config/products';

declare global {
  interface Window {
    google: any;
  }
}

interface InvoiceFormOrderedProps {
  invoice: Invoice;
  onChange: (invoice: Invoice) => void;
  onSave: () => void;
  onSaveDraft: () => void;
  onPayNow: () => void;
}

const InvoiceFormOrdered: React.FC<InvoiceFormOrderedProps> = ({ 
  invoice,
  onChange,
  onSave,
  onSaveDraft,
  onPayNow
}) => {
  // Generate products list
  const products = generateProducts();
  
  // Search state for mattress selection
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state - matching wizard structure
  const [formData, setFormData] = useState({
    address: invoice.customerAddress?.split(',')[0] || '',
    suburb: '',
    state: 'NSW',
    postcode: '',
    distance: 0,
    deliveryFee: 0,
    customDeliveryFee: undefined as number | undefined,
    deliveryDate: invoice.deliveryDate || '',
    deliveryDateOption: (invoice.deliveryDateOption || 'specific') as 'specific' | 'callLater',
    selectedProducts: invoice.items || [],
    needsBase: invoice.needsBase || false,
    floorType: invoice.floorType || '',
    customerName: invoice.customerName || '',
    customerEmail: invoice.customerEmail || '',
    customerPhone: invoice.customerPhone || '',
    twoPersonDelivery: false,
  });

  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  
  // Date modal state
  const currentDate = formData.deliveryDate ? new Date(formData.deliveryDate + 'T00:00:00') : new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState(currentDate.getDate());
  
  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);

  // Google Maps API configuration
  const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyCAn-JvV4sTaGP5P4zFb0PlzFYOinzH1A8';
  const WAREHOUSE_ADDRESS = '136 Victoria Road, Marrickville NSW';

  // Load Google Maps script
  useEffect(() => {
    const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
    
    if (window.google && window.google.maps && window.google.maps.places) {
      setGoogleMapsLoaded(true);
    } else if (!existingScript) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places&loading=async`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        const checkPlaces = setInterval(() => {
          if (window.google && window.google.maps && window.google.maps.places) {
            setGoogleMapsLoaded(true);
            clearInterval(checkPlaces);
          }
        }, 100);
      };
      document.head.appendChild(script);
    } else {
      const checkGoogleMaps = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          setGoogleMapsLoaded(true);
          clearInterval(checkGoogleMaps);
        }
      }, 100);
    }
  }, []);

  // Initialize autocomplete
  useEffect(() => {
    if (googleMapsLoaded && addressInputRef.current && !autocompleteRef.current) {
      try {
        if (!window.google || !window.google.maps || !window.google.maps.places) {
          console.log('Waiting for Google Places library...');
          return;
        }
        
        const autocomplete = new window.google.maps.places.Autocomplete(addressInputRef.current, {
          componentRestrictions: { country: 'au' },
          fields: ['formatted_address', 'geometry', 'address_components'],
          types: ['address']
        });

        const placeChangedListener = autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place.formatted_address) {
            let streetNumber = '';
            let streetName = '';
            let suburb = '';
            let state = '';
            let postcode = '';
            
            if (place.address_components) {
              place.address_components.forEach((component: any) => {
                const types = component.types;
                if (types.includes('street_number')) {
                  streetNumber = component.long_name;
                } else if (types.includes('route')) {
                  streetName = component.long_name;
                } else if (types.includes('locality')) {
                  suburb = component.long_name;
                } else if (types.includes('administrative_area_level_1')) {
                  state = component.short_name;
                } else if (types.includes('postal_code')) {
                  postcode = component.long_name;
                }
              });
            }
            
            const streetAddress = `${streetNumber} ${streetName}`.trim();
            setFormData(prev => ({
              ...prev,
              address: streetAddress,
              suburb: suburb,
              state: state,
              postcode: postcode
            }));
            
            if (addressInputRef.current) {
              addressInputRef.current.value = streetAddress;
            }
            
            calculateDistanceFromWarehouse(place.formatted_address);
          }
        });

        autocompleteRef.current = autocomplete;

        return () => {
          if (placeChangedListener) {
            window.google.maps.event.removeListener(placeChangedListener);
          }
          autocompleteRef.current = null;
        };
      } catch (error) {
        console.error('Error initializing autocomplete:', error);
      }
    }
  }, [googleMapsLoaded]);

  const calculateDistanceFromWarehouse = async (customerAddress: string) => {
    setIsLoadingAddress(true);
    try {
      const service = new window.google.maps.DistanceMatrixService();
      
      service.getDistanceMatrix({
        origins: [WAREHOUSE_ADDRESS],
        destinations: [customerAddress],
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false,
      }, (response: any, status: string) => {
        if (status === 'OK' && response.rows[0]) {
          const element = response.rows[0].elements[0];
          
          if (element.status === 'OK') {
            const distanceInKm = Math.round(element.distance.value / 1000);
            const deliveryInfo = calculateDeliveryFee(distanceInKm);
            
            setFormData(prev => ({
              ...prev,
              distance: distanceInKm,
              deliveryFee: deliveryInfo.fee > 0 ? deliveryInfo.fee : 0,
            }));
          }
        }
        setIsLoadingAddress(false);
      });
    } catch (error) {
      console.error('Error calculating distance:', error);
      setIsLoadingAddress(false);
    }
  };

  const calculateDeliveryFee = (distance: number) => {
    if (distance <= 15) {
      return { fee: 0, message: 'Free delivery!' };
    } else if (distance <= 18) {
      return { fee: 0, message: "You're just outside our free zone, but we'll give you free delivery anyway!" };
    } else if (distance <= 110) {
      return { fee: distance * 2, message: `$${distance * 2} delivery fee (${distance}km from warehouse)` };
    } else {
      return { fee: -1, message: 'Please contact us for a custom delivery quote (beyond 110km)' };
    }
  };

  // Update parent invoice whenever formData changes
  useEffect(() => {
    const fullAddress = formData.address && formData.suburb && formData.postcode
      ? `${formData.address}, ${formData.suburb} ${formData.state} ${formData.postcode}`
      : '';
    
    const deliveryInfo = calculateDeliveryFee(formData.distance);
    const twoPersonFee = formData.twoPersonDelivery ? (formData.distance <= 15 ? 50 : 50 + ((formData.distance - 15) * 2.5)) : 0;
    
    // Use custom delivery fee if set (when quote is needed)
    const baseDeliveryFee = deliveryInfo.fee === -1 && formData.customDeliveryFee !== undefined 
      ? formData.customDeliveryFee 
      : (deliveryInfo.fee > 0 ? deliveryInfo.fee : 0);
    
    const totalDeliveryFee = baseDeliveryFee + twoPersonFee;
    
    let deliveryNotes = `Delivery: ${totalDeliveryFee === 0 ? 'FREE' : `$${totalDeliveryFee}`} (${formData.distance}km)`;
    if (formData.twoPersonDelivery) {
      deliveryNotes += `\n2-Person Delivery: YES (additional $${twoPersonFee})`;
    }
    deliveryNotes += `\nDelivery Date: ${formData.deliveryDateOption === 'callLater' ? 'Call to schedule' : formData.deliveryDate}`;
    
    const updatedInvoice: Invoice = {
      ...invoice,
      customerName: formData.customerName,
      customerEmail: formData.customerEmail,
      customerPhone: formData.customerPhone,
      customerAddress: fullAddress,
      items: formData.selectedProducts,
      deliveryAccess: formData.needsBase ? `Base required - ${formData.floorType} floor` : 'No base required',
      deliveryDate: formData.deliveryDate,
      deliveryDateOption: formData.deliveryDateOption,
      needsBase: formData.needsBase,
      floorType: formData.floorType,
      notes: deliveryNotes,
    };
    
    onChange(updatedInvoice);
  }, [formData]);

  const today = new Date();
  const dateOptions = [];
  
  // Generate 6 dates (today + next 5 days)
  for (let i = 0; i < 6; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : 
                    date.toLocaleDateString('en-US', { weekday: 'short' });
    const dateStr = date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
    dateOptions.push({
      label: dayName,
      date: dateStr,
      value: date.toISOString().split('T')[0],
      fullDate: date
    });
  }

  const delivery = calculateDeliveryFee(formData.distance);
  const twoPersonFee = formData.distance <= 15 ? 50 : 50 + ((formData.distance - 15) * 2.5);
  
  // Use custom delivery fee if it's set (when quote is needed)
  const baseDeliveryFee = delivery.fee === -1 && formData.customDeliveryFee !== undefined 
    ? formData.customDeliveryFee 
    : (delivery.fee > 0 ? delivery.fee : 0);
    
  const totalDeliveryFee = formData.twoPersonDelivery 
    ? baseDeliveryFee + twoPersonFee
    : baseDeliveryFee;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold text-gray-900 mb-8">Create New Invoice</h2>
      
      {/* Section 1: Address */}
      <div className="mb-10 pb-10 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold">Delivery Address</h3>
        </div>
        
        <div className="space-y-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search for address</label>
            <input
              ref={addressInputRef}
              type="text"
              placeholder="Start typing address..."
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
              defaultValue={formData.address}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const value = (e.target as HTMLInputElement).value;
                  if (value) {
                    calculateDistanceFromWarehouse(value);
                  }
                }
              }}
            />
            {isLoadingAddress && (
              <div className="absolute right-3 top-11">
                <div className="animate-spin h-5 w-5 border-2 border-purple-500 border-t-transparent rounded-full" />
              </div>
            )}
          </div>
          {!googleMapsLoaded && (
            <p className="text-sm text-gray-500">Loading address autocomplete...</p>
          )}
          <p className="text-xs text-gray-500">
            Start typing for suggestions or press Enter to calculate distance
          </p>
          <div className="grid grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Street/Address"
              className="px-4 py-2 border rounded-lg col-span-3"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
            <input
              type="text"
              placeholder="Suburb"
              className="px-4 py-2 border rounded-lg"
              value={formData.suburb}
              onChange={(e) => setFormData({ ...formData, suburb: e.target.value })}
            />
            <input
              type="text"
              placeholder="State"
              className="px-4 py-2 border rounded-lg"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            />
            <input
              type="text"
              placeholder="Postcode"
              className="px-4 py-2 border rounded-lg"
              value={formData.postcode}
              onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Section 2: Delivery */}
      <div className="mb-10 pb-10 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <Truck className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold">Delivery Cost</h3>
        </div>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600">Distance from warehouse:</span>
              <span className="font-semibold">{formData.distance}km</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Standard delivery fee:</span>
              <span className="text-2xl font-bold text-green-600">
                {delivery.fee === 0 ? 'FREE' : delivery.fee === -1 ? 'Quote needed' : `$${delivery.fee}`}
              </span>
            </div>
            <p className="mt-4 text-sm text-gray-600">{delivery.message}</p>
            
            {/* Custom delivery cost input when quote is needed */}
            {delivery.fee === -1 && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter custom delivery cost:
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">$</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.customDeliveryFee || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      customDeliveryFee: e.target.value ? parseFloat(e.target.value) : 0,
                      deliveryFee: e.target.value ? parseFloat(e.target.value) : 0
                    })}
                    placeholder="Enter delivery cost"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-600">
                  Since the delivery is beyond 110km, please enter a custom delivery quote for the customer.
                </p>
              </div>
            )}
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                checked={formData.twoPersonDelivery}
                onChange={(e) => setFormData({ ...formData, twoPersonDelivery: e.target.checked })}
                className="mt-1 mr-3 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <p className="text-sm text-blue-800">
                  <strong>2-Person Delivery</strong> (Tue/Wed/Thu only)<br />
                  Additional ${twoPersonFee.toFixed(0)} (${formData.distance <= 15 ? '50 for first 15km' : `50 + $${((formData.distance - 15) * 2.5).toFixed(0)} for extra ${formData.distance - 15}km`})
                </p>
              </div>
            </label>
          </div>
          
          {formData.twoPersonDelivery && (
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">Total Delivery Cost:</span>
                <span className="text-2xl font-bold text-green-700">
                  ${totalDeliveryFee > 0 ? totalDeliveryFee.toFixed(0) : 'FREE'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Schedule */}
      <div className="mb-10 pb-10 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold">Delivery Schedule</h3>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            {dateOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFormData({ 
                  ...formData, 
                  deliveryDate: option.value,
                  deliveryDateOption: 'specific'
                })}
                className={`p-4 border-2 rounded-xl text-center hover:bg-purple-50 transition-all ${
                  formData.deliveryDate === option.value 
                    ? 'border-purple-500 bg-purple-100 font-semibold' 
                    : 'border-gray-300'
                }`}
              >
                <div className="text-sm font-medium">{option.label}</div>
                <div className="text-lg">{option.date}</div>
              </button>
            ))}
            
            <button
              onClick={() => setShowDateModal(true)}
              className={`p-4 border-2 rounded-xl text-center transition-all ${
                formData.deliveryDate && !dateOptions.some(o => o.value === formData.deliveryDate)
                  ? 'border-orange-500 bg-orange-100 font-semibold hover:bg-orange-200'
                  : 'border-orange-300 bg-orange-50 hover:bg-orange-100'
              }`}
            >
              <div className="text-sm font-medium">📅</div>
              <div className="text-sm">Pick Date</div>
            </button>
            
            <button
              onClick={() => setFormData({ 
                ...formData, 
                deliveryDateOption: 'callLater',
                deliveryDate: ''
              })}
              className={`p-4 border-2 rounded-xl text-center transition-all ${
                formData.deliveryDateOption === 'callLater'
                  ? 'border-green-500 bg-green-100 font-semibold hover:bg-green-200'
                  : 'border-green-300 bg-green-50 hover:bg-green-100'
              }`}
            >
              <div className="text-sm font-medium">📞</div>
              <div className="text-sm">Call Later</div>
            </button>
          </div>
          
          {/* Date picker modal */}
          {showDateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-8 shadow-xl max-w-md w-full">
                <h3 className="text-xl font-semibold mb-6 text-center">Select Delivery Date</h3>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedYear(selectedYear - 1)}
                      className="p-2 bg-purple-100 hover:bg-purple-200 rounded-lg"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <input
                      type="number"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value) || selectedYear)}
                      className="flex-1 px-4 py-3 text-center text-lg font-semibold border-2 border-purple-300 rounded-xl"
                      min={new Date().getFullYear()}
                      max={new Date().getFullYear() + 2}
                    />
                    <button
                      onClick={() => setSelectedYear(selectedYear + 1)}
                      className="p-2 bg-purple-100 hover:bg-purple-200 rounded-lg"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedMonth(selectedMonth > 1 ? selectedMonth - 1 : 12)}
                      className="p-2 bg-purple-100 hover:bg-purple-200 rounded-lg"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1 px-4 py-3 text-center text-lg font-semibold border-2 border-purple-300 rounded-xl bg-white">
                      {['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'][selectedMonth - 1]}
                    </div>
                    <button
                      onClick={() => setSelectedMonth(selectedMonth < 12 ? selectedMonth + 1 : 1)}
                      className="p-2 bg-purple-100 hover:bg-purple-200 rounded-lg"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Day</label>
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: new Date(selectedYear, selectedMonth, 0).getDate() }, (_, i) => i + 1).map(day => (
                      <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={`p-2 rounded-lg text-sm font-medium transition-all ${
                          selectedDay === day
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-100 hover:bg-purple-100'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="bg-purple-50 p-3 rounded-lg mb-6">
                  <p className="text-center text-purple-700 font-semibold">
                    {['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'][selectedMonth - 1]} {selectedDay}, {selectedYear}
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDateModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const newDate = new Date(selectedYear, selectedMonth - 1, selectedDay);
                      const dateString = newDate.toISOString().split('T')[0];
                      setFormData({ 
                        ...formData, 
                        deliveryDate: dateString,
                        deliveryDateOption: 'specific'
                      });
                      setShowDateModal(false);
                    }}
                    className="flex-1 px-4 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 font-medium"
                  >
                    Select Date
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {formData.deliveryDate && !dateOptions.some(o => o.value === formData.deliveryDate) && (
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-purple-700 font-medium">
                Selected: {new Date(formData.deliveryDate + 'T00:00:00').toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          )}
          
          {formData.deliveryDateOption === 'callLater' && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-blue-700 font-medium">
                We'll call you to schedule delivery at a convenient time
              </p>
            </div>
          )}
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Delivery window:</strong> 11am - 3pm<br />
              We'll call or text when leaving the previous delivery
            </p>
          </div>
        </div>
      </div>

      {/* Section 4: Mattress */}
      <div className="mb-10 pb-10 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <Package className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold">Choose Mattress</h3>
        </div>
        
        {/* Search bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cloud6k"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          {searchQuery && (
            <p className="text-sm text-gray-600 mt-2">
              {products.filter((product) => {
                const query = searchQuery.toLowerCase();
                return (
                  product.sku.toLowerCase().includes(query) ||
                  product.name.toLowerCase().includes(query) ||
                  product.range.toLowerCase().includes(query) ||
                  product.firmness.toLowerCase().includes(query) ||
                  product.size.toLowerCase().includes(query)
                );
              }).length} products found
            </p>
          )}
        </div>
        
        <div className="grid gap-3 max-h-96 overflow-y-auto">
          {products
            .filter((product) => {
              if (!searchQuery) return true;
              const query = searchQuery.toLowerCase();
              return (
                product.sku.toLowerCase().includes(query) ||
                product.name.toLowerCase().includes(query) ||
                product.range.toLowerCase().includes(query) ||
                product.firmness.toLowerCase().includes(query) ||
                product.size.toLowerCase().includes(query)
              );
            })
            .map((product) => (
            <label
              key={product.sku}
              className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
            >
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.selectedProducts.some(p => p.sku === product.sku)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({
                        ...formData,
                        selectedProducts: [...formData.selectedProducts, { ...product, quantity: 1 }]
                      });
                    } else {
                      setFormData({
                        ...formData,
                        selectedProducts: formData.selectedProducts.filter(p => p.sku !== product.sku)
                      });
                    }
                  }}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-gray-500">{product.sku}</div>
                </div>
              </div>
              <span className="font-semibold">${product.price.toFixed(0)}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Section 5: Base */}
      <div className="mb-10 pb-10 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <Home className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold">Base Requirements</h3>
        </div>
        
        <div className="space-y-3">
          <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="needsBase"
              value="yes"
              checked={formData.needsBase === true}
              onChange={() => setFormData({ ...formData, needsBase: true })}
              className="mr-3"
            />
            <div className="font-medium">Yes, I need a base</div>
          </label>
          
          <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="needsBase"
              value="no"
              checked={formData.needsBase === false}
              onChange={() => setFormData({ ...formData, needsBase: false })}
              className="mr-3"
            />
            <div className="font-medium">No base needed</div>
          </label>
        </div>

        {formData.needsBase && (
          <div className="space-y-3 mt-4">
            <h4 className="font-medium">What type of floor will the base be on?</h4>
            <div className="space-y-2">
              {['Carpet', 'Hard floor (timber/tiles/concrete)'].map((floor) => (
                <label key={floor} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="floorType"
                    value={floor}
                    checked={formData.floorType === floor}
                    onChange={(e) => setFormData({ ...formData, floorType: e.target.value })}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">{floor}</div>
                    {floor === 'Hard floor (timber/tiles/concrete)' && (
                      <div className="text-sm text-green-600">We'll add felt protectors to prevent scratching</div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Section 6: Customer Details */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <User className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold">Customer Details</h3>
        </div>
        
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Customer name *"
            className="w-full px-4 py-3 border rounded-lg"
            value={formData.customerName}
            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            required
          />
          <input
            type="email"
            placeholder="Email address *"
            className="w-full px-4 py-3 border rounded-lg"
            value={formData.customerEmail}
            onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
            required
          />
          <input
            type="tel"
            placeholder="Phone number"
            className="w-full px-4 py-3 border rounded-lg"
            value={formData.customerPhone}
            onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
          />
        </div>
      </div>

      {/* Summary */}
      <div className="bg-green-50 p-6 rounded-lg mb-8">
        <h4 className="font-semibold mb-4">Invoice Summary</h4>
        <div className="space-y-2 text-sm">
          {formData.address && (
            <div className="flex justify-between">
              <span className="text-gray-600">Delivery to:</span>
              <span className="font-medium">{formData.address}, {formData.suburb} {formData.postcode}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Delivery date:</span>
            <span className="font-medium">
              {formData.deliveryDateOption === 'callLater' ? 'Call to schedule' : formData.deliveryDate || 'Not selected'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Products:</span>
            <span className="font-medium">{formData.selectedProducts.length} item(s)</span>
          </div>
          {formData.needsBase && (
            <div className="flex justify-between">
              <span className="text-gray-600">Base required:</span>
              <span className="font-medium">{formData.floorType || 'Floor type not selected'}</span>
            </div>
          )}
          {formData.twoPersonDelivery && (
            <div className="flex justify-between">
              <span className="text-gray-600">2-Person Delivery:</span>
              <span className="font-medium text-blue-600">Yes (+ ${twoPersonFee.toFixed(0)})</span>
            </div>
          )}
          <div className="pt-3 mt-3 border-t border-green-200">
            <div className="flex justify-between">
              <span className="text-gray-700">Subtotal:</span>
              <span className="font-semibold">
                ${formData.selectedProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Delivery:</span>
              <span className="font-semibold">
                {totalDeliveryFee <= 0 ? 'FREE' : `$${totalDeliveryFee}`}
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2">
              <span>Total:</span>
              <span>
                ${(formData.selectedProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0) + (totalDeliveryFee > 0 ? totalDeliveryFee : 0)).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={onSaveDraft}
          className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 font-medium transition-colors"
        >
          Save Draft
        </button>
        <button
          onClick={onSave}
          disabled={!formData.customerName || !formData.customerEmail || formData.selectedProducts.length === 0}
          className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
        >
          Save Invoice
        </button>
        <button
          onClick={onPayNow}
          disabled={!formData.customerName || !formData.customerEmail || formData.selectedProducts.length === 0}
          className="flex-1 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
        >
          Pay Now
        </button>
      </div>
    </div>
  );
};

export default InvoiceFormOrdered;