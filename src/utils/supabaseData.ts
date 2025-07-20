import { supabase } from './supabase';

// Fetch printer brands and models
export const fetchPrinterBrands = async () => {
  try {
    const { data: brands, error } = await supabase
      .from('printer_brands')
      .select(`
        id,
        name,
        models:printer_models!inner(id, name, type)
      `)
      .eq('is_active', true)
      .eq('models.is_active', true)
      .order('name');

    if (error) throw error;

    return brands.map(brand => ({
      id: brand.id,
      name: brand.name,
      models: brand.models.filter((model: any) => model.id).map((model: any) => ({
        id: model.id,
        name: model.name,
        type: model.type
      }))
    }));
  } catch (error) {
    console.error('Error fetching printer brands:', error);
    return [];
  }
};

// Fetch problem categories and problems
export const fetchProblemCategories = async () => {
  try {
    const { data: categories, error } = await supabase
      .from('problem_categories')
      .select(`
        id,
        name,
        icon,
        problems:problems!inner(id, name, description, severity, estimated_time, estimated_cost)
      `)
      .eq('is_active', true)
      .eq('problems.is_active', true)
      .order('name');

    if (error) throw error;

    return categories.map(category => ({
      id: category.id,
      name: category.name,
      icon: category.icon,
      problems: category.problems.filter((problem: any) => problem.id).map((problem: any) => ({
        id: problem.id,
        name: problem.name,
        description: problem.description,
        severity: problem.severity,
        estimatedTime: problem.estimated_time,
        estimatedCost: problem.estimated_cost
      }))
    }));
  } catch (error) {
    console.error('Error fetching problem categories:', error);
    return [];
  }
};

// Add new printer brand
export const addPrinterBrand = async (name: string) => {
  try {
    const { error } = await supabase
      .from('printer_brands')
      .insert({ name });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error adding printer brand:', error);
    throw error;
  }
};

// Add new printer model
export const addPrinterModel = async (brandId: string, name: string, type: string) => {
  try {
    const { error } = await supabase
      .from('printer_models')
      .insert({ brand_id: brandId, name, type });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error adding printer model:', error);
    throw error;
  }
};

// Update printer model
export const updatePrinterModel = async (id: string, name: string, type: string) => {
  try {
    const { error } = await supabase
      .from('printer_models')
      .update({ name, type })
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating printer model:', error);
    throw error;
  }
};

// Delete printer model
export const deletePrinterModel = async (id: string) => {
  try {
    const { error } = await supabase
      .from('printer_models')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting printer model:', error);
    throw error;
  }
};

// Add new problem category
export const addProblemCategory = async (name: string, icon: string) => {
  try {
    const { error } = await supabase
      .from('problem_categories')
      .insert({ name, icon });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error adding problem category:', error);
    throw error;
  }
};

// Add new problem
export const addProblem = async (categoryId: string, name: string, description: string, severity: string, estimatedTime: string, estimatedCost: string) => {
  try {
    const { error } = await supabase
      .from('problems')
      .insert({ 
        category_id: categoryId, 
        name, 
        description, 
        severity, 
        estimated_time: estimatedTime, 
        estimated_cost: estimatedCost 
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error adding problem:', error);
    throw error;
  }
};

// Update problem
export const updateProblem = async (id: string, name: string, description: string, severity: string, estimatedTime: string, estimatedCost: string) => {
  try {
    const { error } = await supabase
      .from('problems')
      .update({ 
        name, 
        description, 
        severity, 
        estimated_time: estimatedTime, 
        estimated_cost: estimatedCost 
      })
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating problem:', error);
    throw error;
  }
};

// Delete problem
export const deleteProblem = async (id: string) => {
  try {
    const { error } = await supabase
      .from('problems')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting problem:', error);
    throw error;
  }
};

// Update printer brand
export const updatePrinterBrand = async (id: string, name: string) => {
  try {
    const { error } = await supabase
      .from('printer_brands')
      .update({ name })
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating printer brand:', error);
    throw error;
  }
};

// Update problem category
export const updateProblemCategory = async (id: string, name: string, icon: string) => {
  try {
    const { error } = await supabase
      .from('problem_categories')
      .update({ name, icon })
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating problem category:', error);
    throw error;
  }
};

// Delete printer brand
export const deletePrinterBrand = async (id: string) => {
  try {
    const { error } = await supabase
      .from('printer_brands')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting printer brand:', error);
    throw error;
  }
};

// Delete problem category
export const deleteProblemCategory = async (id: string) => {
  try {
    const { error } = await supabase
      .from('problem_categories')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting problem category:', error);
    throw error;
  }
};

// Gallery management functions
export const fetchGalleryImages = async () => {
  try {
    const { data: images, error } = await supabase
      .from('gallery_images')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return images || [];
  } catch (error) {
    console.error('Error fetching gallery images:', error);
    return [];
  }
};

export const addGalleryImage = async (data: {
  title: string;
  alt_text: string;
  image_url: string;
  category: string;
  sort_order?: number;
}) => {
  try {
    const { error } = await supabase
      .from('gallery_images')
      .insert(data);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error adding gallery image:', error);
    throw error;
  }
};

export const updateGalleryImage = async (id: string, data: {
  title?: string;
  alt_text?: string;
  image_url?: string;
  category?: string;
  sort_order?: number;
}) => {
  try {
    const { error } = await supabase
      .from('gallery_images')
      .update(data)
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating gallery image:', error);
    throw error;
  }
};

export const deleteGalleryImage = async (id: string) => {
  try {
    const { error } = await supabase
      .from('gallery_images')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting gallery image:', error);
    throw error;
  }
};

// Add new technician
export const addTechnician = async (data: {
  name: string;
  phone: string;
  email?: string;
  specialization: string[];
  experience: number;
  rating: number;
}) => {
  try {
    console.log('supabaseData: Adding new technician to database:', data);
    
    // Add default values for is_active and is_available
    const technicianData = {
      ...data,
      is_active: true,
      is_available: true
    };
    
    console.log('supabaseData: Technician data with defaults:', technicianData);
    
    const { error } = await supabase
      .from('technicians')
      .insert(technicianData);

    if (error) {
      console.error('supabaseData: Database insert error:', error);
      throw error;
    }
    
    console.log('supabaseData: Technician added successfully');
    return true;
  } catch (error) {
    console.error('supabaseData: Error adding technician:', error);
    throw error;
  }
};

// Update technician
export const updateTechnician = async (id: string, data: any) => {
  try {
    console.log('supabaseData: Updating technician in database:', id, data);
    
    // Check current technician data before update
    const { data: currentTechnician, error: fetchError } = await supabase
      .from('technicians')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error('supabaseData: Error fetching current technician:', fetchError);
      throw fetchError;
    }
    
    console.log('supabaseData: Current technician data:', currentTechnician);
    
    const { error } = await supabase
      .from('technicians')
      .update(data)
      .eq('id', id);

    if (error) {
      console.error('supabaseData: Database update error:', error);
      throw error;
    }
    
    // Verify update was successful
    const { data: updatedTechnician, error: verifyError } = await supabase
      .from('technicians')
      .select('*')
      .eq('id', id)
      .single();
    
    if (verifyError) {
      console.error('supabaseData: Error verifying technician update:', verifyError);
    } else {
      console.log('supabaseData: Technician updated successfully:', updatedTechnician);
    }
    
    return true;
  } catch (error) {
    console.error('supabaseData: Error updating technician:', error);
    throw error;
  }
};

// Delete technician (soft delete)
export const deleteTechnician = async (id: string) => {
  try {
    console.log('supabaseData: Soft deleting technician:', id);
    
    // Check current technician data before delete
    const { data: currentTechnician, error: fetchError } = await supabase
      .from('technicians')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error('supabaseData: Error fetching current technician:', fetchError);
      throw fetchError;
    }
    
    console.log('supabaseData: Current technician data before delete:', currentTechnician);
    
    const { error } = await supabase
      .from('technicians')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('supabaseData: Database delete error:', error);
      throw error;
    }
    
    // Verify delete was successful
    const { data: deletedTechnician, error: verifyError } = await supabase
      .from('technicians')
      .select('*')
      .eq('id', id)
      .single();
    
    if (verifyError) {
      console.error('supabaseData: Error verifying technician delete:', verifyError);
    } else {
      console.log('supabaseData: Technician soft deleted successfully:', deletedTechnician);
    }
    
    return true;
  } catch (error) {
    console.error('supabaseData: Error deleting technician:', error);
    throw error;
  }
};

// Delete ALL technicians (hard delete) - for clearing dummy data
export const deleteAllTechnicians = async () => {
  try {
    console.log('supabaseData: Deleting ALL technicians from database (hard delete)');
    
    // First, get count of existing technicians
    const { data: existingTechnicians, error: countError } = await supabase
      .from('technicians')
      .select('id, name');
    
    if (countError) {
      console.error('supabaseData: Error counting existing technicians:', countError);
      throw countError;
    }
    
    console.log('supabaseData: Found technicians to delete:', existingTechnicians?.length || 0);
    console.log('supabaseData: Technicians list:', existingTechnicians);
    
    // Hard delete all technicians
    const { error } = await supabase
      .from('technicians')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

    if (error) {
      console.error('supabaseData: Database delete all error:', error);
      throw error;
    }
    
    // Verify all technicians are deleted
    const { data: remainingTechnicians, error: verifyError } = await supabase
      .from('technicians')
      .select('id, name');
    
    if (verifyError) {
      console.error('supabaseData: Error verifying technicians deletion:', verifyError);
    } else {
      console.log('supabaseData: Remaining technicians after deletion:', remainingTechnicians?.length || 0);
      console.log('supabaseData: All technicians deleted successfully');
    }
    
    return true;
  } catch (error) {
    console.error('supabaseData: Error deleting all technicians:', error);
    throw error;
  }
};
// Fetch technicians
export const fetchTechnicians = async () => {
  try {
    console.log('supabaseData: Fetching technicians from database with is_active = true');
    const { data: technicians, error } = await supabase
      .from('technicians')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('supabaseData: Database fetch error:', error);
      throw error;
    }
    
    console.log('supabaseData: Fetched technicians from database:', technicians);
    console.log('supabaseData: Total active technicians found:', technicians?.length || 0);
    return technicians || [];
  } catch (error) {
    console.error('supabaseData: Error fetching technicians:', error);
    return [];
  }
};

// Admin functions
export const updateBookingStatus = async (bookingId: string, status: string) => {
  try {
    const { error } = await supabase
      .from('service_bookings')
      .update({ status })
      .eq('id', bookingId);

    if (error) throw error;

    // Update timeline
    await supabase
      .from('booking_timeline')
      .update({ 
        completed: true, 
        completed_at: new Date().toISOString() 
      })
      .eq('booking_id', bookingId)
      .eq('status', status);

    return true;
  } catch (error) {
    console.error('Error updating booking status:', error);
    return false;
  }
};

export const assignTechnician = async (bookingId: string, technicianId: string) => {
  try {
    const { error } = await supabase
      .from('service_bookings')
      .update({ technician_id: technicianId })
      .eq('id', bookingId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error assigning technician:', error);
    return false;
  }
};

export const updateActualCost = async (bookingId: string, actualCost: string) => {
  try {
    const { error } = await supabase
      .from('service_bookings')
      .update({ actual_cost: actualCost })
      .eq('id', bookingId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating actual cost:', error);
    return false;
  }
};