import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// 🔹 GET all leads with pagination
export const getLeadsContent = createAsyncThunk(
  "leads/content",
  async ({ page = 1, limit = 10 } = {}) => {
    const response = await axios.get(
      `https://hrms-management-backend.onrender.com/api/employees?page=${page}&limit=${limit}`
    );
    return response.data;
  }
);

// 🔹 DELETE a lead from backend
export const deleteLeadFromServer = createAsyncThunk(
  "leads/delete",
  async (id) => {
    const response = await axios.delete(
      `https://hrms-management-backend.onrender.com/api/employees/${id}`
    );
    return id; // return the deleted ID so reducer can remove it
  }
);

export const leadsSlice = createSlice({
  name: "leads",
  initialState: {
    isLoading: false,
    leads: [],
    pagination: {
      currentPage: 1,
      totalPages: 0,
      totalItems: 0,
      itemsPerPage: 10,
      hasNextPage: false,
      hasPrevPage: false,
    },
  },
  reducers: {
    addNewLead: (state, action) => {
      const { newLeadObj } = action.payload;
      state.leads.push(newLeadObj);
    },
    setPage: (state, action) => {
      state.pagination.currentPage = action.payload;
    },
  },

  extraReducers: (builder) => {
    builder
      // 🔹 GET leads handlers
      .addCase(getLeadsContent.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getLeadsContent.fulfilled, (state, action) => {
        state.leads = action.payload.data;
        state.pagination = action.payload.pagination;
        state.isLoading = false;
      })
      .addCase(getLeadsContent.rejected, (state) => {
        state.isLoading = false;
      })

      // 🔹 DELETE lead handlers
      .addCase(deleteLeadFromServer.fulfilled, (state, action) => {
        const deletedId = action.payload;
        state.leads = state.leads.filter((lead) => lead._id !== deletedId);
        // Update pagination after delete
        state.pagination.totalItems -= 1;
        if (
          state.pagination.totalItems % state.pagination.itemsPerPage === 0 &&
          state.pagination.currentPage > 1
        ) {
          state.pagination.currentPage -= 1;
          state.pagination.totalPages = Math.ceil(
            state.pagination.totalItems / state.pagination.itemsPerPage
          );
        }
      });
  },
});

export const { addNewLead, setPage } = leadsSlice.actions;

export default leadsSlice.reducer;
