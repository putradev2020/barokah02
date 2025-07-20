import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { 
  Users, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Printer,
  Wrench,
  Image,
  LogOut,
  RefreshCw,
  Eye,
  UserCheck,
  DollarSign
} from 'lucide-react';
import { 
  getAllBookings, 
  updateBookingStatus as updateBookingStatusSupabase,
  assignTechnician as assignTechnicianSupabase,
  updateActualCost as updateActualCostSupabase,
  deleteBooking as deleteBookingSupabase
} from '../utils/bookingSupabase';
import { 
  fetchPrinterBrands, 
  fetchProblemCategories, 
  fetchTechnicians,
  fetchGalleryImages,
  addPrinterBrand,
  addPrinterModel,
  updatePrinterBrand,
  updatePrinterModel,
  deletePrinterBrand,
  deletePrinterModel,
  addProblemCategory,
  addProblem,
  updateProblemCategory,
  updateProblem,
  deleteProblemCategory,
  deleteProblem,
  addTechnician,
  updateTechnician,
  deleteTechnician,
  addGalleryImage,
  updateGalleryImage,
  deleteGalleryImage
} from '../utils/supabaseData';
import { supabase } from '../utils/supabase';
import NotificationSystem from './NotificationSystem';

interface AdminDashboardProps {
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate, onLogout }) => {
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState<any[]>([]);
  const [printerBrands, setPrinterBrands] = useState<any[]>([]);
  const [problemCategories, setProblemCategories] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Edit states
  const [editingBrand, setEditingBrand] = useState<any>(null);
  const [editingModel, setEditingModel] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingProblem, setEditingProblem] = useState<any>(null);
  const [editingTechnician, setEditingTechnician] = useState<any>(null);
  const [editingImage, setEditingImage] = useState<any>(null);

  // Form states
  const [newBrandName, setNewBrandName] = useState('');
  const [newModelData, setNewModelData] = useState({ brandId: '', name: '', type: 'inkjet' });
  const [newCategoryData, setNewCategoryData] = useState({ name: '', icon: 'Printer' });
  const [newProblemData, setNewProblemData] = useState({
    categoryId: '',
    name: '',
    description: '',
    severity: 'medium',
    estimatedTime: '',
    estimatedCost: ''
  });
  const [newTechnicianData, setNewTechnicianData] = useState({
    name: '',
    phone: '',
    email: '',
    specialization: [] as string[],
    experience: 0,
    rating: 5
  });
  const [newImageData, setNewImageData] = useState({
    title: '',
    alt_text: '',
    image_url: '',
    category: 'service',
    sort_order: 0
  });

  // Load all data
  useEffect(() => {
    loadAllData();
    setupRealtimeSubscriptions();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      console.log('Loading all admin data...');
      
      const [
        bookingsData,
        brandsData,
        categoriesData,
        techniciansData,
        imagesData
      ] = await Promise.all([
        getAllBookings(),
        fetchPrinterBrands(),
        fetchProblemCategories(),
        fetchTechnicians(),
        fetchGalleryImages()
      ]);

      console.log('Loaded data:', {
        bookings: bookingsData.length,
        brands: brandsData.length,
        categories: categoriesData.length,
        technicians: techniciansData.length,
        images: imagesData.length
      });

      setBookings(bookingsData);
      setPrinterBrands(brandsData);
      setProblemCategories(categoriesData);
      setTechnicians(techniciansData);
      setGalleryImages(imagesData);

      // Create notifications for new bookings
      const newNotifications = bookingsData
        .filter(booking => booking.status === 'pending')
        .map(booking => ({
          id: Date.now() + Math.random(),
          message: `Booking baru dari ${booking.customer.name} - ${booking.printer.brand} ${booking.printer.model}`,
          timestamp: booking.createdAt,
          read: false
        }));

      setNotifications(newNotifications);
    } catch (error) {
      console.error('Error loading admin data:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Gagal memuat data admin'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to booking changes
    const bookingsChannel = supabase
      .channel('admin-bookings-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'service_bookings'
      }, () => {
        console.log('Booking change detected, reloading...');
        getAllBookings().then(setBookings);
      })
      .subscribe();

    // Subscribe to other table changes
    const brandsChannel = supabase
      .channel('admin-brands-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'printer_brands'
      }, () => {
        console.log('Printer brands change detected, reloading...');
        fetchPrinterBrands().then(setPrinterBrands);
      })
      .subscribe();

    const modelsChannel = supabase
      .channel('admin-models-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'printer_models'
      }, () => {
        console.log('Printer models change detected, reloading...');
        fetchPrinterBrands().then(setPrinterBrands);
      })
      .subscribe();

    const categoriesChannel = supabase
      .channel('admin-categories-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'problem_categories'
      }, () => {
        console.log('Problem categories change detected, reloading...');
        fetchProblemCategories().then(setProblemCategories);
      })
      .subscribe();

    const problemsChannel = supabase
      .channel('admin-problems-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'problems'
      }, () => {
        console.log('Problems change detected, reloading...');
        fetchProblemCategories().then(setProblemCategories);
      })
      .subscribe();

    const techniciansChannel = supabase
      .channel('admin-technicians-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'technicians'
      }, () => {
        console.log('Technicians change detected, reloading...');
        fetchTechnicians().then(setTechnicians);
      })
      .subscribe();

    const galleryChannel = supabase
      .channel('admin-gallery-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'gallery_images'
      }, () => {
        console.log('Gallery images change detected, reloading...');
        fetchGalleryImages().then(setGalleryImages);
      })
      .subscribe();

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(brandsChannel);
      supabase.removeChannel(modelsChannel);
      supabase.removeChannel(categoriesChannel);
      supabase.removeChannel(problemsChannel);
      supabase.removeChannel(techniciansChannel);
      supabase.removeChannel(galleryChannel);
    };
  };

  // Booking management functions
  const handleUpdateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      console.log('Updating booking status:', { bookingId, newStatus });
      
      const result = await Swal.fire({
        title: 'Konfirmasi',
        text: `Ubah status booking menjadi "${newStatus}"?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Ya, Ubah',
        cancelButtonText: 'Batal'
      });

      if (result.isConfirmed) {
        await updateBookingStatusSupabase(bookingId, newStatus);
        
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: 'Status booking berhasil diubah',
          timer: 2000,
          showConfirmButton: false
        });

        // Reload bookings
        const updatedBookings = await getAllBookings();
        setBookings(updatedBookings);
      }
    } catch (error: any) {
      console.error('Error updating booking status:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Gagal mengubah status booking'
      });
    }
  };

  const handleAssignTechnician = async (bookingId: string, technicianId: string) => {
    try {
      console.log('Assigning technician:', { bookingId, technicianId });
      
      await assignTechnicianSupabase(bookingId, technicianId);
      
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Teknisi berhasil ditugaskan',
        timer: 2000,
        showConfirmButton: false
      });

      // Reload bookings
      const updatedBookings = await getAllBookings();
      setBookings(updatedBookings);
    } catch (error: any) {
      console.error('Error assigning technician:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Gagal menugaskan teknisi'
      });
    }
  };

  const handleUpdateActualCost = async (bookingId: string, actualCost: string) => {
    try {
      console.log('Updating actual cost:', { bookingId, actualCost });
      
      await updateActualCostSupabase(bookingId, actualCost);
      
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Biaya aktual berhasil diperbarui',
        timer: 2000,
        showConfirmButton: false
      });

      // Reload bookings
      const updatedBookings = await getAllBookings();
      setBookings(updatedBookings);
    } catch (error: any) {
      console.error('Error updating actual cost:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Gagal memperbarui biaya aktual'
      });
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    try {
      console.log('Deleting booking:', bookingId);
      
      const result = await Swal.fire({
        title: 'Konfirmasi Hapus',
        text: 'Yakin ingin menghapus booking ini? Data tidak dapat dikembalikan!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, Hapus',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#dc2626'
      });

      if (result.isConfirmed) {
        await deleteBookingSupabase(bookingId);
        
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: 'Booking berhasil dihapus',
          timer: 2000,
          showConfirmButton: false
        });

        // Reload bookings
        const updatedBookings = await getAllBookings();
        setBookings(updatedBookings);
      }
    } catch (error: any) {
      console.error('Error deleting booking:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Gagal menghapus booking'
      });
    }
  };

  // Printer Brand management functions
  const handleAddBrand = async () => {
    if (!newBrandName.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Peringatan',
        text: 'Nama brand tidak boleh kosong'
      });
      return;
    }

    try {
      console.log('Adding new brand:', newBrandName);
      await addPrinterBrand(newBrandName.trim());
      
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Brand printer berhasil ditambahkan',
        timer: 2000,
        showConfirmButton: false
      });

      setNewBrandName('');
      
      // Reload brands
      const updatedBrands = await fetchPrinterBrands();
      setPrinterBrands(updatedBrands);
    } catch (error: any) {
      console.error('Error adding brand:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Gagal menambahkan brand'
      });
    }
  };

  const handleUpdateBrand = async (brandId: string, newName: string) => {
    if (!newName.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Peringatan',
        text: 'Nama brand tidak boleh kosong'
      });
      return;
    }

    try {
      console.log('Updating brand:', { brandId, newName });
      await updatePrinterBrand(brandId, newName.trim());
      
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Brand printer berhasil diperbarui',
        timer: 2000,
        showConfirmButton: false
      });

      setEditingBrand(null);
      
      // Reload brands
      const updatedBrands = await fetchPrinterBrands();
      setPrinterBrands(updatedBrands);
    } catch (error: any) {
      console.error('Error updating brand:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Gagal memperbarui brand'
      });
    }
  };

  const handleDeleteBrand = async (brandId: string, brandName: string) => {
    try {
      console.log('Deleting brand:', { brandId, brandName });
      
      const result = await Swal.fire({
        title: 'Konfirmasi Hapus',
        text: `Yakin ingin menghapus brand "${brandName}"? Semua model dalam brand ini juga akan dihapus!`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, Hapus',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#dc2626'
      });

      if (result.isConfirmed) {
        await deletePrinterBrand(brandId);
        
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: 'Brand printer berhasil dihapus',
          timer: 2000,
          showConfirmButton: false
        });

        // Reload brands
        const updatedBrands = await fetchPrinterBrands();
        setPrinterBrands(updatedBrands);
      }
    } catch (error: any) {
      console.error('Error deleting brand:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Gagal menghapus brand'
      });
    }
  };

  // Printer Model management functions
  const handleAddModel = async () => {
    if (!newModelData.brandId || !newModelData.name.trim() || !newModelData.type) {
      Swal.fire({
        icon: 'warning',
        title: 'Peringatan',
        text: 'Semua field harus diisi'
      });
      return;
    }

    try {
      console.log('Adding new model:', newModelData);
      await addPrinterModel(newModelData.brandId, newModelData.name.trim(), newModelData.type);
      
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Model printer berhasil ditambahkan',
        timer: 2000,
        showConfirmButton: false
      });

      setNewModelData({ brandId: '', name: '', type: 'inkjet' });
      
      // Reload brands (includes models)
      const updatedBrands = await fetchPrinterBrands();
      setPrinterBrands(updatedBrands);
    } catch (error: any) {
      console.error('Error adding model:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Gagal menambahkan model'
      });
    }
  };

  const handleUpdateModel = async (modelId: string, newName: string, newType: string) => {
    if (!newName.trim() || !newType) {
      Swal.fire({
        icon: 'warning',
        title: 'Peringatan',
        text: 'Nama dan tipe model tidak boleh kosong'
      });
      return;
    }

    try {
      console.log('Updating model:', { modelId, newName, newType });
      await updatePrinterModel(modelId, newName.trim(), newType);
      
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Model printer berhasil diperbarui',
        timer: 2000,
        showConfirmButton: false
      });

      setEditingModel(null);
      
      // Reload brands (includes models)
      const updatedBrands = await fetchPrinterBrands();
      setPrinterBrands(updatedBrands);
    } catch (error: any) {
      console.error('Error updating model:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Gagal memperbarui model'
      });
    }
  };

  const handleDeleteModel = async (modelId: string, modelName: string) => {
    try {
      console.log('Deleting model:', { modelId, modelName });
      
      const result = await Swal.fire({
        title: 'Konfirmasi Hapus',
        text: `Yakin ingin menghapus model "${modelName}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, Hapus',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#dc2626'
      });

      if (result.isConfirmed) {
        await deletePrinterModel(modelId);
        
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: 'Model printer berhasil dihapus',
          timer: 2000,
          showConfirmButton: false
        });

        // Reload brands (includes models)
        const updatedBrands = await fetchPrinterBrands();
        setPrinterBrands(updatedBrands);
      }
    } catch (error: any) {
      console.error('Error deleting model:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Gagal menghapus model'
      });
    }
  };

  // Problem Category management functions
  const handleAddCategory = async () => {
    if (!newCategoryData.name.trim() || !newCategoryData.icon) {
      Swal.fire({
        icon: 'warning',
        title: 'Peringatan',
        text: 'Nama kategori dan icon harus diisi'
      });
      return;
    }

    try {
      console.log('Adding new category:', newCategoryData);
      await addProblemCategory(newCategoryData.name.trim(), newCategoryData.icon);
      
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Kategori masalah berhasil ditambahkan',
        timer: 2000,
        showConfirmButton: false
      });

      setNewCategoryData({ name: '', icon: 'Printer' });
      
      // Reload categories
      const updatedCategories = await fetchProblemCategories();
      setProblemCategories(updatedCategories);
    } catch (error: any) {
      console.error('Error adding category:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Gagal menambahkan kategori'
      });
    }
  };

  const handleUpdateCategory = async (categoryId: string, newName: string, newIcon: string) => {
    if (!newName.trim() || !newIcon) {
      Swal.fire({
        icon: 'warning',
        title: 'Peringatan',
        text: 'Nama kategori dan icon tidak boleh kosong'
      });
      return;
    }

    try {
      console.log('Updating category:', { categoryId, newName, newIcon });
      await updateProblemCategory(categoryId, newName.trim(), newIcon);
      
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Kategori masalah berhasil diperbarui',
        timer: 2000,
        showConfirmButton: false
      });

      setEditingCategory(null);
      
      // Reload categories
      const updatedCategories = await fetchProblemCategories();
      setProblemCategories(updatedCategories);
    } catch (error: any) {
      console.error('Error updating category:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Gagal memperbarui kategori'
      });
    }
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    try {
      console.log('Deleting category:', { categoryId, categoryName });
      
      const result = await Swal.fire({
        title: 'Konfirmasi Hapus',
        text: `Yakin ingin menghapus kategori "${categoryName}"? Semua masalah dalam kategori ini juga akan dihapus!`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, Hapus',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#dc2626'
      });

      if (result.isConfirmed) {
        await deleteProblemCategory(categoryId);
        
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: 'Kategori masalah berhasil dihapus',
          timer: 2000,
          showConfirmButton: false
        });

        // Reload categories
        const updatedCategories = await fetchProblemCategories();
        setProblemCategories(updatedCategories);
      }
    } catch (error: any) {
      console.error('Error deleting category:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Gagal menghapus kategori'
      });
    }
  };

  // Problem management functions
  const handleAddProblem = async () => {
    if (!newProblemData.categoryId || !newProblemData.name.trim() || !newProblemData.description.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Peringatan',
        text: 'Kategori, nama, dan deskripsi masalah harus diisi'
      });
      return;
    }

    try {
      console.log('Adding new problem:', newProblemData);
      await addProblem(
        newProblemData.categoryId,
        newProblemData.name.trim(),
        newProblemData.description.trim(),
        newProblemData.severity,
        newProblemData.estimatedTime,
        newProblemData.estimatedCost
      );
      
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Masalah berhasil ditambahkan',
        timer: 2000,
        showConfirmButton: false
      });

      setNewProblemData({
        categoryId: '',
        name: '',
        description: '',
        severity: 'medium',
        estimatedTime: '',
        estimatedCost: ''
      });
      
      // Reload categories (includes problems)
      const updatedCategories = await fetchProblemCategories();
      setProblemCategories(updatedCategories);
    } catch (error: any) {
      console.error('Error adding problem:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Gagal menambahkan masalah'
      });
    }
  };

  const handleUpdateProblem = async (problemId: string, data: any) => {
    if (!data.name.trim() || !data.description.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Peringatan',
        text: 'Nama dan deskripsi masalah tidak boleh kosong'
      });
      return;
    }

    try {
      console.log('Updating problem:', { problemId, data });
      await updateProblem(
        problemId,
        data.name.trim(),
        data.description.trim(),
        data.severity,
        data.estimatedTime,
        data.estimatedCost
      );
      
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Masalah berhasil diperbarui',
        timer: 2000,
        showConfirmButton: false
      });

      setEditingProblem(null);
      
      // Reload categories (includes problems)
      const updatedCategories = await fetchProblemCategories();
      setProblemCategories(updatedCategories);
    } catch (error: any) {
      console.error('Error updating problem:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Gagal memperbarui masalah'
      });
    }
  };

  const handleDeleteProblem = async (problemId: string, problemName: string) => {
    try {
      console.log('Deleting problem:', { problemId, problemName });
      
      const result = await Swal.fire({
        title: 'Konfirmasi Hapus',
        text: `Yakin ingin menghapus masalah "${problemName}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, Hapus',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#dc2626'
      });

      if (result.isConfirmed) {
        await deleteProblem(problemId);
        
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: 'Masalah berhasil dihapus',
          timer: 2000,
          showConfirmButton: false
        });

        // Reload categories (includes problems)
        const updatedCategories = await fetchProblemCategories();
        setProblemCategories(updatedCategories);
      }
    } catch (error: any) {
      console.error('Error deleting problem:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Gagal menghapus masalah'
      });
    }
  };

  // Technician management functions
  const handleAddTechnician = async () => {
    if (!newTechnicianData.name.trim() || !newTechnicianData.phone.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Peringatan',
        text: 'Nama dan nomor HP teknisi harus diisi'
      });
      return;
    }

    try {
      console.log('Adding new technician:', newTechnicianData);
      await addTechnician({
        name: newTechnicianData.name.trim(),
        phone: newTechnicianData.phone.trim(),
        email: newTechnicianData.email.trim() || undefined,
        specialization: newTechnicianData.specialization,
        experience: newTechnicianData.experience,
        rating: newTechnicianData.rating
      });
      
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Teknisi berhasil ditambahkan',
        timer: 2000,
        showConfirmButton: false
      });

      setNewTechnicianData({
        name: '',
        phone: '',
        email: '',
        specialization: [],
        experience: 0,
        rating: 5
      });
      
      // Reload technicians
      const updatedTechnicians = await fetchTechnicians();
      setTechnicians(updatedTechnicians);
    } catch (error: any) {
      console.error('Error adding technician:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Gagal menambahkan teknisi'
      });
    }
  };

  const handleUpdateTechnician = async (technicianId: string, data: any) => {
    if (!data.name.trim() || !data.phone.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Peringatan',
        text: 'Nama dan nomor HP teknisi tidak boleh kosong'
      });
      return;
    }

    try {
      console.log('Updating technician:', { technicianId, data });
      await updateTechnician(technicianId, {
        name: data.name.trim(),
        phone: data.phone.trim(),
        email: data.email.trim() || null,
        specialization: data.specialization,
        experience: data.experience,
        rating: data.rating,
        is_available: data.is_available,
        is_active: data.is_active
      });
      
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Teknisi berhasil diperbarui',
        timer: 2000,
        showConfirmButton: false
      });

      setEditingTechnician(null);
      
      // Reload technicians
      const updatedTechnicians = await fetchTechnicians();
      setTechnicians(updatedTechnicians);
    } catch (error: any) {
      console.error('Error updating technician:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Gagal memperbarui teknisi'
      });
    }
  };

  const handleDeleteTechnician = async (technicianId: string, technicianName: string) => {
    try {
      console.log('Deleting technician:', { technicianId, technicianName });
      
      const result = await Swal.fire({
        title: 'Konfirmasi Hapus',
        text: `Yakin ingin menghapus teknisi "${technicianName}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, Hapus',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#dc2626'
      });

      if (result.isConfirmed) {
        await deleteTechnician(technicianId);
        
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: 'Teknisi berhasil dihapus',
          timer: 2000,
          showConfirmButton: false
        });

        // Reload technicians
        const updatedTechnicians = await fetchTechnicians();
        setTechnicians(updatedTechnicians);
      }
    } catch (error: any) {
      console.error('Error deleting technician:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Gagal menghapus teknisi'
      });
    }
  };

  // Gallery management functions
  const handleAddImage = async () => {
    if (!newImageData.title.trim() || !newImageData.image_url.trim() || !newImageData.alt_text.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Peringatan',
        text: 'Title, URL gambar, dan alt text harus diisi'
      });
      return;
    }

    try {
      console.log('Adding new image:', newImageData);
      await addGalleryImage({
        title: newImageData.title.trim(),
        alt_text: newImageData.alt_text.trim(),
        image_url: newImageData.image_url.trim(),
        category: newImageData.category,
        sort_order: newImageData.sort_order
      });
      
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Gambar berhasil ditambahkan',
        timer: 2000,
        showConfirmButton: false
      });

      setNewImageData({
        title: '',
        alt_text: '',
        image_url: '',
        category: 'service',
        sort_order: 0
      });
      
      // Reload images
      const updatedImages = await fetchGalleryImages();
      setGalleryImages(updatedImages);
    } catch (error: any) {
      console.error('Error adding image:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Gagal menambahkan gambar'
      });
    }
  };

  const handleUpdateImage = async (imageId: string, data: any) => {
    if (!data.title.trim() || !data.image_url.trim() || !data.alt_text.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Peringatan',
        text: 'Title, URL gambar, dan alt text tidak boleh kosong'
      });
      return;
    }

    try {
      console.log('Updating image:', { imageId, data });
      await updateGalleryImage(imageId, {
        title: data.title.trim(),
        alt_text: data.alt_text.trim(),
        image_url: data.image_url.trim(),
        category: data.category,
        sort_order: data.sort_order
      });
      
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Gambar berhasil diperbarui',
        timer: 2000,
        showConfirmButton: false
      });

      setEditingImage(null);
      
      // Reload images
      const updatedImages = await fetchGalleryImages();
      setGalleryImages(updatedImages);
    } catch (error: any) {
      console.error('Error updating image:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Gagal memperbarui gambar'
      });
    }
  };

  const handleDeleteImage = async (imageId: string, imageTitle: string) => {
    try {
      console.log('Deleting image:', { imageId, imageTitle });
      
      const result = await Swal.fire({
        title: 'Konfirmasi Hapus',
        text: `Yakin ingin menghapus gambar "${imageTitle}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, Hapus',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#dc2626'
      });

      if (result.isConfirmed) {
        await deleteGalleryImage(imageId);
        
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: 'Gambar berhasil dihapus',
          timer: 2000,
          showConfirmButton: false
        });

        // Reload images
        const updatedImages = await fetchGalleryImages();
        setGalleryImages(updatedImages);
      }
    } catch (error: any) {
      console.error('Error deleting image:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Gagal menghapus gambar'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Menunggu';
      case 'confirmed':
        return 'Dikonfirmasi';
      case 'in-progress':
        return 'Dalam Proses';
      case 'completed':
        return 'Selesai';
      case 'cancelled':
        return 'Dibatalkan';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Memuat dashboard admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                Barokah Printer
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <NotificationSystem notifications={notifications} />
              <button
                onClick={() => loadAllData()}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Refresh Data"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto">
            {[
              { id: 'bookings', label: 'Booking Management', icon: Calendar },
              { id: 'brands', label: 'Printer Brands', icon: Printer },
              { id: 'problems', label: 'Problem Categories', icon: Wrench },
              { id: 'technicians', label: 'Technicians', icon: Users },
              { id: 'gallery', label: 'Gallery', icon: Image }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Booking Management */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Booking Management</h2>
              <div className="text-sm text-gray-500">
                Total: {bookings.length} bookings
              </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {bookings.map((booking) => (
                  <li key={booking.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-blue-600 truncate">
                            #{booking.id}
                          </p>
                          <div className="ml-2 flex-shrink-0 flex">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                              {getStatusLabel(booking.status)}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <p className="font-medium text-gray-900">{booking.customer.name}</p>
                              <p>{booking.customer.phone}</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{booking.printer.brand} {booking.printer.model}</p>
                              <p>{booking.problem.category}</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{formatDate(booking.service.date)}</p>
                              <p>{booking.service.time} WIB</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex items-center space-x-2">
                        <select
                          value={booking.status}
                          onChange={(e) => handleUpdateBookingStatus(booking.id, e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="pending">Menunggu</option>
                          <option value="confirmed">Dikonfirmasi</option>
                          <option value="in-progress">Dalam Proses</option>
                          <option value="completed">Selesai</option>
                          <option value="cancelled">Dibatalkan</option>
                        </select>
                        <select
                          value={booking.technician || ''}
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAssignTechnician(booking.id, e.target.value);
                            }
                          }}
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="">Pilih Teknisi</option>
                          {technicians.map((tech) => (
                            <option key={tech.id} value={tech.id}>
                              {tech.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => {
                            Swal.fire({
                              title: 'Update Biaya Aktual',
                              input: 'text',
                              inputValue: booking.actualCost || booking.estimatedCost,
                              inputPlaceholder: 'Rp 100.000',
                              showCancelButton: true,
                              confirmButtonText: 'Update',
                              cancelButtonText: 'Batal'
                            }).then((result) => {
                              if (result.isConfirmed && result.value) {
                                handleUpdateActualCost(booking.id, result.value);
                              }
                            });
                          }}
                          className="p-1 text-green-600 hover:text-green-800"
                          title="Update Biaya"
                        >
                          <DollarSign className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBooking(booking.id)}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Hapus Booking"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Printer Brands Management */}
        {activeTab === 'brands' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Printer Brands & Models</h2>
            </div>

            {/* Add Brand Form */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Tambah Brand Baru</h3>
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder="Nama brand (contoh: Canon)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                />
                <button
                  onClick={handleAddBrand}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Tambah Brand</span>
                </button>
              </div>
            </div>

            {/* Add Model Form */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Tambah Model Baru</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select
                  value={newModelData.brandId}
                  onChange={(e) => setNewModelData({...newModelData, brandId: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Pilih Brand</option>
                  {printerBrands.map((brand) => (
                    <option key={brand.id} value={brand.id}>{brand.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newModelData.name}
                  onChange={(e) => setNewModelData({...newModelData, name: e.target.value})}
                  placeholder="Nama model (contoh: PIXMA G2010)"
                  className="px-3 py-2 border border-gray-300 rounded-md"
                />
                <select
                  value={newModelData.type}
                  onChange={(e) => setNewModelData({...newModelData, type: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="inkjet">Inkjet</option>
                  <option value="laser">Laser</option>
                  <option value="multifunction">Multifunction</option>
                </select>
                <button
                  onClick={handleAddModel}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Tambah Model</span>
                </button>
              </div>
            </div>

            {/* Brands List */}
            <div className="space-y-4">
              {printerBrands.map((brand) => (
                <div key={brand.id} className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center justify-between mb-4">
                    {editingBrand?.id === brand.id ? (
                      <div className="flex items-center space-x-2 flex-1">
                        <input
                          type="text"
                          value={editingBrand.name}
                          onChange={(e) => setEditingBrand({...editingBrand, name: e.target.value})}
                          className="px-3 py-2 border border-gray-300 rounded-md"
                        />
                        <button
                          onClick={() => handleUpdateBrand(brand.id, editingBrand.name)}
                          className="p-2 text-green-600 hover:text-green-800"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingBrand(null)}
                          className="p-2 text-gray-600 hover:text-gray-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-lg font-medium text-gray-900">{brand.name}</h3>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setEditingBrand({id: brand.id, name: brand.name})}
                            className="p-2 text-blue-600 hover:text-blue-800"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBrand(brand.id, brand.name)}
                            className="p-2 text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {brand.models.map((model: any) => (
                      <div key={model.id} className="border border-gray-200 rounded-lg p-4">
                        {editingModel?.id === model.id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editingModel.name}
                              onChange={(e) => setEditingModel({...editingModel, name: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            />
                            <select
                              value={editingModel.type}
                              onChange={(e) => setEditingModel({...editingModel, type: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            >
                              <option value="inkjet">Inkjet</option>
                              <option value="laser">Laser</option>
                              <option value="multifunction">Multifunction</option>
                            </select>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleUpdateModel(model.id, editingModel.name, editingModel.type)}
                                className="p-1 text-green-600 hover:text-green-800"
                              >
                                <Save className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setEditingModel(null)}
                                className="p-1 text-gray-600 hover:text-gray-800"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">{model.name}</p>
                                <p className="text-sm text-gray-500 capitalize">{model.type}</p>
                              </div>
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => setEditingModel({id: model.id, name: model.name, type: model.type})}
                                  className="p-1 text-blue-600 hover:text-blue-800"
                                >
                                  <Edit className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteModel(model.id, model.name)}
                                  className="p-1 text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Problem Categories Management */}
        {activeTab === 'problems' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Problem Categories & Problems</h2>
            </div>

            {/* Add Category Form */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Tambah Kategori Baru</h3>
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={newCategoryData.name}
                  onChange={(e) => setNewCategoryData({...newCategoryData, name: e.target.value})}
                  placeholder="Nama kategori (contoh: Masalah Pencetakan)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                />
                <input
                  type="text"
                  value={newCategoryData.icon}
                  onChange={(e) => setNewCategoryData({...newCategoryData, icon: e.target.value})}
                  placeholder="Icon (contoh: Printer)"
                  className="px-3 py-2 border border-gray-300 rounded-md"
                />
                <button
                  onClick={handleAddCategory}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Tambah Kategori</span>
                </button>
              </div>
            </div>

            {/* Add Problem Form */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Tambah Masalah Baru</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  value={newProblemData.categoryId}
                  onChange={(e) => setNewProblemData({...newProblemData, categoryId: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Pilih Kategori</option>
                  {problemCategories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newProblemData.name}
                  onChange={(e) => setNewProblemData({...newProblemData, name: e.target.value})}
                  placeholder="Nama masalah"
                  className="px-3 py-2 border border-gray-300 rounded-md"
                />
                <textarea
                  value={newProblemData.description}
                  onChange={(e) => setNewProblemData({...newProblemData, description: e.target.value})}
                  placeholder="Deskripsi masalah"
                  className="px-3 py-2 border border-gray-300 rounded-md"
                  rows={2}
                />
                <select
                  value={newProblemData.severity}
                  onChange={(e) => setNewProblemData({...newProblemData, severity: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="low">Ringan</option>
                  <option value="medium">Sedang</option>
                  <option value="high">Berat</option>
                </select>
                <input
                  type="text"
                  value={newProblemData.estimatedTime}
                  onChange={(e) => setNewProblemData({...newProblemData, estimatedTime: e.target.value})}
                  placeholder="Estimasi waktu (contoh: 1-2 jam)"
                  className="px-3 py-2 border border-gray-300 rounded-md"
                />
                <input
                  type="text"
                  value={newProblemData.estimatedCost}
                  onChange={(e) => setNewProblemData({...newProblemData, estimatedCost: e.target.value})}
                  placeholder="Estimasi biaya (contoh: Rp 50.000 - 100.000)"
                  className="px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="mt-4">
                <button
                  onClick={handleAddProblem}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Tambah Masalah</span>
                </button>
              </div>
            </div>

            {/* Categories List */}
            <div className="space-y-4">
              {problemCategories.map((category) => (
                <div key={category.id} className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center justify-between mb-4">
                    {editingCategory?.id === category.id ? (
                      <div className="flex items-center space-x-2 flex-1">
                        <input
                          type="text"
                          value={editingCategory.name}
                          onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                          className="px-3 py-2 border border-gray-300 rounded-md"
                        />
                        <input
                          type="text"
                          value={editingCategory.icon}
                          onChange={(e) => setEditingCategory({...editingCategory, icon: e.target.value})}
                          className="px-3 py-2 border border-gray-300 rounded-md"
                        />
                        <button
                          onClick={() => handleUpdateCategory(category.id, editingCategory.name, editingCategory.icon)}
                          className="p-2 text-green-600 hover:text-green-800"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingCategory(null)}
                          className="p-2 text-gray-600 hover:text-gray-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setEditingCategory({id: category.id, name: category.name, icon: category.icon})}
                            className="p-2 text-blue-600 hover:text-blue-800"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id, category.name)}
                            className="p-2 text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {category.problems.map((problem: any) => (
                      <div key={problem.id} className="border border-gray-200 rounded-lg p-4">
                        {editingProblem?.id === problem.id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editingProblem.name}
                              onChange={(e) => setEditingProblem({...editingProblem, name: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            />
                            <textarea
                              value={editingProblem.description}
                              onChange={(e) => setEditingProblem({...editingProblem, description: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                              rows={2}
                            />
                            <select
                              value={editingProblem.severity}
                              onChange={(e) => setEditingProblem({...editingProblem, severity: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            >
                              <option value="low">Ringan</option>
                              <option value="medium">Sedang</option>
                              <option value="high">Berat</option>
                            </select>
                            <input
                              type="text"
                              value={editingProblem.estimatedTime}
                              onChange={(e) => setEditingProblem({...editingProblem, estimatedTime: e.target.value})}
                              placeholder="Estimasi waktu"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            />
                            <input
                              type="text"
                              value={editingProblem.estimatedCost}
                              onChange={(e) => setEditingProblem({...editingProblem, estimatedCost: e.target.value})}
                              placeholder="Estimasi biaya"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            />
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleUpdateProblem(problem.id, editingProblem)}
                                className="p-1 text-green-600 hover:text-green-800"
                              >
                                <Save className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setEditingProblem(null)}
                                className="p-1 text-gray-600 hover:text-gray-800"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{problem.name}</p>
                                <p className="text-sm text-gray-600 mt-1">{problem.description}</p>
                                <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                                  <span className={`px-2 py-1 rounded-full ${
                                    problem.severity === 'high' ? 'bg-red-100 text-red-800' :
                                    problem.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    {problem.severity === 'high' ? 'Berat' : problem.severity === 'medium' ? 'Sedang' : 'Ringan'}
                                  </span>
                                  <span>{problem.estimatedTime}</span>
                                  <span>{problem.estimatedCost}</span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1 ml-2">
                                <button
                                  onClick={() => setEditingProblem({
                                    id: problem.id,
                                    name: problem.name,
                                    description: problem.description,
                                    severity: problem.severity,
                                    estimatedTime: problem.estimatedTime,
                                    estimatedCost: problem.estimatedCost
                                  })}
                                  className="p-1 text-blue-600 hover:text-blue-800"
                                >
                                  <Edit className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProblem(problem.id, problem.name)}
                                  className="p-1 text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Technicians Management */}
        {activeTab === 'technicians' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Technicians Management</h2>
            </div>

            {/* Add Technician Form */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Tambah Teknisi Baru</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={newTechnicianData.name}
                  onChange={(e) => setNewTechnicianData({...newTechnicianData, name: e.target.value})}
                  placeholder="Nama teknisi"
                  className="px-3 py-2 border border-gray-300 rounded-md"
                />
                <input
                  type="tel"
                  value={newTechnicianData.phone}
                  onChange={(e) => setNewTechnicianData({...newTechnicianData, phone: e.target.value})}
                  placeholder="Nomor HP"
                  className="px-3 py-2 border border-gray-300 rounded-md"
                />
                <input
                  type="email"
                  value={newTechnicianData.email}
                  onChange={(e) => setNewTechnicianData({...newTechnicianData, email: e.target.value})}
                  placeholder="Email (opsional)"
                  className="px-3 py-2 border border-gray-300 rounded-md"
                />
                <input
                  type="number"
                  value={newTechnicianData.experience}
                  onChange={(e) => setNewTechnicianData({...newTechnicianData, experience: parseInt(e.target.value) || 0})}
                  placeholder="Pengalaman (tahun)"
                  className="px-3 py-2 border border-gray-300 rounded-md"
                />
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={newTechnicianData.rating}
                  onChange={(e) => setNewTechnicianData({...newTechnicianData, rating: parseFloat(e.target.value) || 5})}
                  placeholder="Rating (1-5)"
                  className="px-3 py-2 border border-gray-300 rounded-md"
                />
                <input
                  type="text"
                  value={newTechnicianData.specialization.join(', ')}
                  onChange={(e) => setNewTechnicianData({...newTechnicianData, specialization: e.target.value.split(',').map(s => s.trim()).filter(s => s)})}
                  placeholder="Spesialisasi (pisahkan dengan koma)"
                  className="px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="mt-4">
                <button
                  onClick={handleAddTechnician}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Tambah Teknisi</span>
                </button>
              </div>
            </div>

            {/* Technicians List */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {technicians.map((technician) => (
                  <li key={technician.id} className="px-6 py-4">
                    {editingTechnician?.id === technician.id ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input
                            type="text"
                            value={editingTechnician.name}
                            onChange={(e) => setEditingTechnician({...editingTechnician, name: e.target.value})}
                            className="px-3 py-2 border border-gray-300 rounded-md"
                          />
                          <input
                            type="tel"
                            value={editingTechnician.phone}
                            onChange={(e) => setEditingTechnician({...editingTechnician, phone: e.target.value})}
                            className="px-3 py-2 border border-gray-300 rounded-md"
                          />
                          <input
                            type="email"
                            value={editingTechnician.email || ''}
                            onChange={(e) => setEditingTechnician({...editingTechnician, email: e.target.value})}
                            className="px-3 py-2 border border-gray-300 rounded-md"
                          />
                          <input
                            type="number"
                            value={editingTechnician.experience}
                            onChange={(e) => setEditingTechnician({...editingTechnician, experience: parseInt(e.target.value) || 0})}
                            className="px-3 py-2 border border-gray-300 rounded-md"
                          />
                          <input
                            type="number"
                            min="1"
                            max="5"
                            step="0.1"
                            value={editingTechnician.rating}
                            onChange={(e) => setEditingTechnician({...editingTechnician, rating: parseFloat(e.target.value) || 5})}
                            className="px-3 py-2 border border-gray-300 rounded-md"
                          />
                          <input
                            type="text"
                            value={editingTechnician.specialization?.join(', ') || ''}
                            onChange={(e) => setEditingTechnician({...editingTechnician, specialization: e.target.value.split(',').map(s => s.trim()).filter(s => s)})}
                            className="px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={editingTechnician.is_available}
                              onChange={(e) => setEditingTechnician({...editingTechnician, is_available: e.target.checked})}
                              className="mr-2"
                            />
                            Tersedia
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={editingTechnician.is_active}
                              onChange={(e) => setEditingTechnician({...editingTechnician, is_active: e.target.checked})}
                              className="mr-2"
                            />
                            Aktif
                          </label>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleUpdateTechnician(technician.id, editingTechnician)}
                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center space-x-2"
                          >
                            <Save className="h-4 w-4" />
                            <span>Simpan</span>
                          </button>
                          <button
                            onClick={() => setEditingTechnician(null)}
                            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center space-x-2"
                          >
                            <X className="h-4 w-4" />
                            <span>Batal</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-lg font-medium text-gray-900 truncate">
                              {technician.name}
                            </p>
                            <div className="ml-2 flex-shrink-0 flex space-x-2">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                technician.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {technician.is_available ? 'Tersedia' : 'Tidak Tersedia'}
                              </span>
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                technician.is_active ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {technician.is_active ? 'Aktif' : 'Nonaktif'}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <p className="font-medium text-gray-900">{technician.phone}</p>
                                <p>{technician.email || 'No email'}</p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{technician.experience} tahun pengalaman</p>
                                <p>Rating: {technician.rating}/5</p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">Spesialisasi:</p>
                                <p>{technician.specialization?.join(', ') || 'Umum'}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4 flex items-center space-x-2">
                          <button
                            onClick={() => setEditingTechnician({
                              id: technician.id,
                              name: technician.name,
                              phone: technician.phone,
                              email: technician.email,
                              specialization: technician.specialization || [],
                              experience: technician.experience,
                              rating: technician.rating,
                              is_available: technician.is_available,
                              is_active: technician.is_active
                            })}
                            className="p-2 text-blue-600 hover:text-blue-800"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTechnician(technician.id, technician.name)}
                            className="p-2 text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Gallery Management */}
        {activeTab === 'gallery' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Gallery Management</h2>
            </div>

            {/* Add Image Form */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Tambah Gambar Baru</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={newImageData.title}
                  onChange={(e) => setNewImageData({...newImageData, title: e.target.value})}
                  placeholder="Judul gambar"
                  className="px-3 py-2 border border-gray-300 rounded-md"
                />
                <input
                  type="text"
                  value={newImageData.alt_text}
                  onChange={(e) => setNewImageData({...newImageData, alt_text: e.target.value})}
                  placeholder="Alt text"
                  className="px-3 py-2 border border-gray-300 rounded-md"
                />
                <input
                  type="url"
                  value={newImageData.image_url}
                  onChange={(e) => setNewImageData({...newImageData, image_url: e.target.value})}
                  placeholder="URL gambar"
                  className="px-3 py-2 border border-gray-300 rounded-md"
                />
                <select
                  value={newImageData.category}
                  onChange={(e) => setNewImageData({...newImageData, category: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="service">Service</option>
                  <option value="workshop">Workshop</option>
                  <option value="team">Team</option>
                  <option value="products">Products</option>
                  <option value="store">Store</option>
                  <option value="equipment">Equipment</option>
                  <option value="parts">Parts</option>
                </select>
                <input
                  type="number"
                  value={newImageData.sort_order}
                  onChange={(e) => setNewImageData({...newImageData, sort_order: parseInt(e.target.value) || 0})}
                  placeholder="Urutan (0 = pertama)"
                  className="px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="mt-4">
                <button
                  onClick={handleAddImage}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Tambah Gambar</span>
                </button>
              </div>
            </div>

            {/* Images Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {galleryImages.map((image) => (
                <div key={image.id} className="bg-white rounded-lg shadow overflow-hidden">
                  {editingImage?.id === image.id ? (
                    <div className="p-4 space-y-4">
                      <input
                        type="text"
                        value={editingImage.title}
                        onChange={(e) => setEditingImage({...editingImage, title: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                      <input
                        type="text"
                        value={editingImage.alt_text}
                        onChange={(e) => setEditingImage({...editingImage, alt_text: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                      <input
                        type="url"
                        value={editingImage.image_url}
                        onChange={(e) => setEditingImage({...editingImage, image_url: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                      <select
                        value={editingImage.category}
                        onChange={(e) => setEditingImage({...editingImage, category: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="service">Service</option>
                        <option value="workshop">Workshop</option>
                        <option value="team">Team</option>
                        <option value="products">Products</option>
                        <option value="store">Store</option>
                        <option value="equipment">Equipment</option>
                        <option value="parts">Parts</option>
                      </select>
                      <input
                        type="number"
                        value={editingImage.sort_order}
                        onChange={(e) => setEditingImage({...editingImage, sort_order: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleUpdateImage(image.id, editingImage)}
                          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center space-x-2"
                        >
                          <Save className="h-4 w-4" />
                          <span>Simpan</span>
                        </button>
                        <button
                          onClick={() => setEditingImage(null)}
                          className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center space-x-2"
                        >
                          <X className="h-4 w-4" />
                          <span>Batal</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <img
                        src={image.image_url}
                        alt={image.alt_text}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{image.title}</h3>
                            <p className="text-sm text-gray-500 capitalize">{image.category}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setEditingImage({
                                id: image.id,
                                title: image.title,
                                alt_text: image.alt_text,
                                image_url: image.image_url,
                                category: image.category,
                                sort_order: image.sort_order
                              })}
                              className="p-2 text-blue-600 hover:text-blue-800"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteImage(image.id, image.title)}
                              className="p-2 text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;