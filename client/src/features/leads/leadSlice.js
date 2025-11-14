import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// 🔹 GET all leads
export const getLeadsContent = createAsyncThunk("leads/content", async () => {
  const response = await axios.get("http://localhost:4000/api/employees");
  return response.data;
});

// 🔹 DELETE a lead from backend
export const deleteLeadFromServer = createAsyncThunk(
  "leads/delete",
  async (id) => {
    const response = await axios.delete(
      `http://localhost:4000/api/employees/${id}`
    );
    return id; // return the deleted ID so reducer can remove it
  }
);

export const leadsSlice = createSlice({
  name: "leads",
  initialState: {
    isLoading: false,
    leads: [],
  },
  reducers: {
    addNewLead: (state, action) => {
      const { newLeadObj } = action.payload;
      state.leads.push(newLeadObj);
    },
  },

  extraReducers: (builder) => {
    builder
      // 🔹 GET leads handlers
      .addCase(getLeadsContent.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getLeadsContent.fulfilled, (state, action) => {
        state.leads = action.payload;
        state.isLoading = false;
      })
      .addCase(getLeadsContent.rejected, (state) => {
        state.isLoading = false;
      })

      // 🔹 DELETE lead handlers
      .addCase(deleteLeadFromServer.fulfilled, (state, action) => {
        const deletedId = action.payload;
        state.leads = state.leads.filter((lead) => lead._id !== deletedId);
      });
  },
});

export const { addNewLead } = leadsSlice.actions;

export default leadsSlice.reducer;
