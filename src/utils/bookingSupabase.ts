import { supabase } from './supabase';

export interface BookingFormData {
  customerName: string;
  phone: string;
  email: string;
  address: string;
  printerBrand: string;
  printerModel: string;
  problemCategory: string;
  problemDescription: string;
  serviceType: string;
  appointmentDate: string;
  appointmentTime: string;
  notes: string;
}

export interface BookingData {
  id: string;
  customer: {
    name: string;
    phone: string;
    email: string;
    address: string;
  };
  printer: {
    brand: string;
    model: string;
  };
  problem: {
    category: string;
    description: string;
  };
  service: {
    type: string;
    date: string;
    time: string;
  };
  status: string;
  technician: string;
  estimatedCost: string;
  actualCost: string;
  notes: string;
  timeline: Array<{
    status: string;
    title: string;
    description: string;
    timestamp: string;
    completed: boolean;
  }>;
  createdAt: string;
}

export const saveBookingToSupabase = async (formData: BookingFormData): Promise<string> => {
  try {
    console.log('Starting booking save process...', formData);
    
    // First, create or get customer
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', formData.phone)
      .maybeSingle();

    let customerId: string;

    if (existingCustomer) {
      customerId = existingCustomer.id;
      console.log('Found existing customer:', customerId);
      // Update customer info
      await supabase
        .from('customers')
        .update({
          name: formData.customerName,
          email: formData.email,
          address: formData.address
        })
        .eq('id', customerId);
    } else {
      console.log('Creating new customer...');
      // Create new customer
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          name: formData.customerName,
          phone: formData.phone,
          email: formData.email,
          address: formData.address
        })
        .select('id')
        .single();

      if (customerError) throw customerError;
      customerId = newCustomer.id;
      console.log('Created new customer:', customerId);
    }

    // Get printer brand and model IDs
    console.log('Looking up printer brand:', formData.printerBrand);
    const { data: brand } = await supabase
      .from('printer_brands')
      .select('id')
      .eq('name', formData.printerBrand)
      .single();

    console.log('Looking up printer model:', formData.printerModel);
    const { data: model } = await supabase
      .from('printer_models')
      .select('id')
      .eq('name', formData.printerModel)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    console.log('Looking up problem category:', formData.problemCategory);
    const { data: category } = await supabase
      .from('problem_categories')
      .select('id')
      .eq('name', formData.problemCategory)
      .single();

    // Get available technician
    console.log('Looking up available technician...');
    const { data: technician } = await supabase
      .from('technicians')
      .select('id')
      .eq('is_available', true)
      .eq('is_active', true)
      .limit(1)
      .single();

    console.log('Found technician:', technician?.id);

    // Create booking
    const bookingData = {
      customer_id: customerId,
      printer_brand_id: brand?.id,
      printer_model_id: model?.id,
      problem_category_id: category?.id,
      problem_description: formData.problemDescription,
      service_type: 'Antar ke Toko',
      appointment_date: formData.appointmentDate,
      appointment_time: formData.appointmentTime,
      technician_id: technician?.id,
      notes: formData.notes,
      estimated_cost: calculateEstimatedCost(formData.problemCategory)
    };
    
    console.log('Creating booking with data:', bookingData);
    
    const { data: booking, error: bookingError } = await supabase
      .from('service_bookings')
      .insert(bookingData)
      .select('id')
      .single();

    if (bookingError) {
      console.error('Booking creation error:', bookingError);
      throw bookingError;
    }

    console.log('Booking created successfully:', booking.id);
    return booking.id;
  } catch (error) {
    console.error('Error saving booking to Supabase:', error);
    throw error;
  }
};

export const getBookingById = async (bookingId: string): Promise<BookingData | null> => {
  try {
    const { data: booking, error } = await supabase
      .from('service_bookings')
      .select(`
        *,
        customer:customers(*),
        printer_brand:printer_brands!left(name, is_active),
        printer_model:printer_models!left(name, is_active),
        problem_category:problem_categories!left(name, is_active),
        technician:technicians!left(name, is_active),
        timeline:booking_timeline(*)
      `)
      .eq('id', bookingId.toUpperCase())
      .eq('printer_brand.is_active', true)
      .eq('printer_model.is_active', true)
      .eq('problem_category.is_active', true)
      .eq('technician.is_active', true)
      .single();

    if (error || !booking) return null;

    return {
      id: booking.id,
      customer: {
        name: booking.customer.name,
        phone: booking.customer.phone,
        email: booking.customer.email || '',
        address: booking.customer.address || ''
      },
      printer: {
        brand: booking.printer_brand?.name || '',
        model: booking.printer_model?.name || ''
      },
      problem: {
        category: booking.problem_category?.name || '',
        description: booking.problem_description || ''
      },
      service: {
        type: booking.service_type,
        date: booking.appointment_date,
        time: booking.appointment_time
      },
      status: booking.status,
      technician: booking.technician?.name || 'Belum ditugaskan',
      estimatedCost: booking.estimated_cost || '',
      actualCost: booking.actual_cost || '',
      notes: booking.notes || '',
      timeline: booking.timeline.map((t: any) => ({
        status: t.status,
        title: t.title,
        description: t.description,
        timestamp: t.completed_at || t.created_at,
        completed: t.completed
      })),
      createdAt: booking.created_at
    };
  } catch (error) {
    console.error('Error fetching booking:', error);
    return null;
  }
};

export const getAllBookings = async (): Promise<BookingData[]> => {
  try {
    console.log('Fetching all bookings from database...');
    
    const { data: bookings, error } = await supabase
      .from('service_bookings')
      .select(`
        *,
        customers!inner(*),
        printer_brands!inner(*, is_active),
        printer_models!inner(*, is_active),
        problem_categories!inner(*, is_active),
        technicians(*, is_active),
        booking_timeline(*)
      `)
      .eq('printer_brands.is_active', true)
      .eq('printer_models.is_active', true)
      .eq('problem_categories.is_active', true)
      .eq('technicians.is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching bookings:', error);
      throw error;
    }

    console.log('Raw booking data from Supabase:', bookings);

    const formattedData = bookings.map((booking: any) => ({
      id: booking.id,
      customer: {
        name: booking.customers?.name || '',
        phone: booking.customers?.phone || '',
        email: booking.customers?.email || '',
        address: booking.customers?.address || ''
      },
      printer: {
        brand: booking.printer_brands?.name || '',
        model: booking.printer_models?.name || ''
      },
      problem: {
        category: booking.problem_categories?.name || '',
        description: booking.problem_description || ''
      },
      service: {
        type: booking.service_type,
        date: booking.appointment_date,
        time: booking.appointment_time
      },
      status: booking.status,
      technician: booking.technicians?.name || 'Belum ditugaskan',
      estimatedCost: booking.estimated_cost || '',
      actualCost: booking.actual_cost || '',
      notes: booking.notes || '',
      timeline: (booking.booking_timeline || []).map((t: any) => ({
        status: t.status,
        title: t.title,
        description: t.description,
        timestamp: t.completed_at || t.created_at,
        completed: t.completed
      })),
      createdAt: booking.created_at
    }));

    console.log('Formatted booking data:', formattedData);
    return formattedData;
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
};

const calculateEstimatedCost = (problemCategory: string): string => {
  const costRanges: { [key: string]: string } = {
    'Masalah Pencetakan': 'Rp 50.000 - 150.000',
    'Masalah Cartridge / Head': 'Rp 75.000 - 200.000',
    'Masalah Kertas': 'Rp 30.000 - 120.000',
    'Masalah Internal': 'Rp 100.000 - 500.000',
    'Masalah Jaringan / Wireless': 'Rp 50.000 - 120.000',
    'Masalah Software / Reset': 'Rp 75.000 - 200.000',
    'Masalah Fisik / Casing': 'Rp 50.000 - 350.000',
    'Masalah Scanner': 'Rp 70.000 - 250.000',
    'Masalah Fax': 'Rp 50.000 - 120.000',
    'Masalah Maintenance': 'Rp 40.000 - 300.000'
  };
  
  return costRanges[problemCategory] || 'Rp 50.000 - 150.000';
};

// Add missing functions for admin dashboard
export const updateBookingStatus = async (bookingId: string, status: string): Promise<void> => {
  try {
    console.log('Updating booking status:', { bookingId, status });
    
    // First, check current status
    const { data: currentData, error: fetchError } = await supabase
      .from('service_bookings')
      .select('id, status')
      .eq('id', bookingId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching current booking:', fetchError);
      throw fetchError;
    }
    
    console.log('Current booking status before update:', currentData);
    
    // Prevent updating to the same status
    if (currentData.status === status) {
      console.log('Status is already the same, skipping update');
      return;
    }
    
    // Check if this status already exists in timeline to prevent duplicates
    const { data: existingTimeline, error: timelineCheckError } = await supabase
      .from('booking_timeline')
      .select('status')
      .eq('booking_id', bookingId)
      .eq('status', status);
    
    if (timelineCheckError) {
      console.error('Error checking timeline:', timelineCheckError);
    } else if (existingTimeline && existingTimeline.length > 0) {
      console.log('Status already exists in timeline, updating existing entry');
      
      // Update existing timeline entry instead of creating new one
      const { error: updateTimelineError } = await supabase
        .from('booking_timeline')
        .update({
          completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('booking_id', bookingId)
        .eq('status', status);
      
      if (updateTimelineError) {
        console.error('Error updating timeline entry:', updateTimelineError);
      }
    }
    
    const { data, error } = await supabase
      .from('service_bookings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', bookingId)
      .select('id, status, updated_at');

    if (error) {
      console.error('Supabase error updating booking status:', error);
      throw error;
    }

    console.log('Booking status updated successfully:', data);
    
    // Verify the update
    const { data: verifyData, error: verifyError } = await supabase
      .from('service_bookings')
      .select('id, status, updated_at')
      .eq('id', bookingId)
      .single();
    
    if (verifyError) {
      console.error('Error verifying update:', verifyError);
    } else {
      console.log('Verified updated booking status:', verifyData);
    }

    // Add timeline entry for status change only if it doesn't exist
    if (!existingTimeline || existingTimeline.length === 0) {
      const statusTitles = {
        'pending': 'Booking Diterima',
        'confirmed': 'Booking Dikonfirmasi',
        'in-progress': 'Teknisi Dalam Perjalanan',
        'servicing': 'Sedang Diperbaiki',
        'completed': 'Service Selesai',
        'cancelled': 'Booking Dibatalkan'
      };
      
      const statusDescriptions = {
        'pending': 'Booking Anda telah diterima dan sedang diproses',
        'confirmed': 'Teknisi telah ditugaskan dan akan datang sesuai jadwal',
        'in-progress': 'Teknisi sedang dalam perjalanan ke lokasi Anda',
        'servicing': 'Printer sedang dalam proses perbaikan',
        'completed': 'Printer telah berhasil diperbaiki dan berfungsi normal',
        'cancelled': 'Booking telah dibatalkan'
      };
      
      const { error: timelineError } = await supabase
        .from('booking_timeline')
        .insert({
          booking_id: bookingId,
          status,
          title: statusTitles[status as keyof typeof statusTitles] || `Status diubah ke ${status}`,
          description: statusDescriptions[status as keyof typeof statusDescriptions] || `Pemesanan diubah statusnya menjadi ${status}`,
          completed: true,
          completed_at: new Date().toISOString()
        });

      if (timelineError) {
        console.error('Error adding timeline entry:', timelineError);
      }
    }
  } catch (error) {
    console.error('Error updating booking status:', error);
    throw error;
  }
};

export const assignTechnician = async (bookingId: string, technicianId: string): Promise<void> => {
  try {
    console.log('Assigning technician:', { bookingId, technicianId });
    
    const { data, error } = await supabase
      .from('service_bookings')
      .update({ technician_id: technicianId, updated_at: new Date().toISOString() })
      .eq('id', bookingId)
      .select();

    if (error) {
      console.error('Supabase error assigning technician:', error);
      throw error;
    }

    console.log('Technician assigned successfully:', data);

    // Add timeline entry for technician assignment
    const { data: technician } = await supabase
      .from('technicians')
      .select('name')
      .eq('id', technicianId)
      .single();

    const { error: timelineError } = await supabase
      .from('booking_timeline')
      .insert({
        booking_id: bookingId,
        status: 'assigned',
        title: 'Teknisi ditugaskan',
        description: `Teknisi ${technician?.name || 'Unknown'} ditugaskan untuk pemesanan ini`,
        completed: true,
        completed_at: new Date().toISOString()
      });

    if (timelineError) {
      console.error('Error adding timeline entry:', timelineError);
    }
  } catch (error) {
    console.error('Error assigning technician:', error);
    throw error;
  }
};

export const updateActualCost = async (bookingId: string, actualCost: string): Promise<void> => {
  try {
    console.log('Updating actual cost:', { bookingId, actualCost });
    
    const { data, error } = await supabase
      .from('service_bookings')
      .update({ actual_cost: actualCost, updated_at: new Date().toISOString() })
      .eq('id', bookingId)
      .select();

    if (error) {
      console.error('Supabase error updating actual cost:', error);
      throw error;
    }

    console.log('Actual cost updated successfully:', data);

    // Add timeline entry for cost update
    const { error: timelineError } = await supabase
      .from('booking_timeline')
      .insert({
        booking_id: bookingId,
        status: 'cost_updated',
        title: 'Biaya aktual diperbarui',
        description: `Biaya aktual diperbarui menjadi ${actualCost}`,
        completed: true,
        completed_at: new Date().toISOString()
      });

    if (timelineError) {
      console.error('Error adding timeline entry:', timelineError);
    }
  } catch (error) {
    console.error('Error updating actual cost:', error);
    throw error;
  }
};



export const deleteBooking = async (bookingId: string): Promise<void> => {
  try {
    console.log('Deleting booking:', { bookingId });
    
    // First delete related timeline entries
    const { error: timelineError } = await supabase
      .from('booking_timeline')
      .delete()
      .eq('booking_id', bookingId);

    if (timelineError) {
      console.error('Error deleting timeline entries:', timelineError);
    }

    // Then delete the booking
    const { data, error } = await supabase
      .from('service_bookings')
      .delete()
      .eq('id', bookingId)
      .select();

    if (error) {
      console.error('Supabase error deleting booking:', error);
      throw error;
    }

    console.log('Booking deleted successfully:', data);
  } catch (error) {
    console.error('Error deleting booking:', error);
    throw error;
  }
};