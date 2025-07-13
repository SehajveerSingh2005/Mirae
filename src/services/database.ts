import { supabase } from '@/utils/supabaseClient';

export interface Page {
  id: string;
  title: string;
  content: string;
  user_id: string;
  folder_id?: string;
  created_at: string;
  updated_at: string;
  is_favorite: boolean;
}

export interface Folder {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePageData {
  title: string;
  content: string;
  folder_id?: string;
}

export interface UpdatePageData {
  title?: string;
  content?: string;
  folder_id?: string;
  is_favorite?: boolean;
}

export interface CreateFolderData {
  name: string;
}

export interface UpdateFolderData {
  name: string;
}

class DatabaseService {
  // Pages
  async getPages(userId: string): Promise<Page[]> {
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching pages:', error);
      throw new Error(`Failed to fetch pages: ${error.message}`);
    }
    return data || [];
  }

  async getPage(pageId: string, userId: string): Promise<Page | null> {
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('id', pageId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  async createPage(userId: string, pageData: CreatePageData): Promise<Page> {
    console.log('Creating page for user:', userId, 'with data:', pageData);
    
    const { data, error } = await supabase
      .from('pages')
      .insert({
        ...pageData,
        user_id: userId,
        is_favorite: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating page:', error);
      throw new Error(`Failed to create page: ${error.message}`);
    }
    
    console.log('Successfully created page:', data);
    return data;
  }

  async updatePage(pageId: string, userId: string, pageData: UpdatePageData): Promise<Page> {
    const { data, error } = await supabase
      .from('pages')
      .update({
        ...pageData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pageId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deletePage(pageId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('pages')
      .delete()
      .eq('id', pageId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async toggleFavorite(pageId: string, userId: string, isFavorite: boolean): Promise<Page> {
    const { data, error } = await supabase
      .from('pages')
      .update({
        is_favorite: isFavorite,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pageId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Folders
  async getFolders(userId: string): Promise<Folder[]> {
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching folders:', error);
      throw new Error(`Failed to fetch folders: ${error.message}`);
    }
    return data || [];
  }

  async createFolder(userId: string, folderData: CreateFolderData): Promise<Folder> {
    const { data, error } = await supabase
      .from('folders')
      .insert({
        ...folderData,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateFolder(folderId: string, userId: string, folderData: UpdateFolderData): Promise<Folder> {
    const { data, error } = await supabase
      .from('folders')
      .update({
        ...folderData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', folderId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteFolder(folderId: string, userId: string): Promise<void> {
    // First, move all pages in this folder to no folder (set folder_id to null)
    await supabase
      .from('pages')
      .update({ folder_id: null })
      .eq('folder_id', folderId)
      .eq('user_id', userId);

    // Then delete the folder
    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', folderId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async movePageToFolder(pageId: string, userId: string, folderId: string | null): Promise<Page> {
    const { data, error } = await supabase
      .from('pages')
      .update({
        folder_id: folderId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pageId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export const databaseService = new DatabaseService(); 