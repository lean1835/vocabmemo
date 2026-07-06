import { baseApi } from "../../../stores/baseApi";

export const vocabApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getVocabs: builder.query<any, any>({
      query: (params) => ({
        url: "/vocab",
        method: "GET",
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }: any) => ({ type: "Vocab" as const, id: _id })),
              { type: "Vocab", id: "LIST" },
            ]
          : [{ type: "Vocab", id: "LIST" }],
    }),
    getVocabById: builder.query<any, string>({
      query: (id) => `/vocab/${id}`,
      providesTags: (result, error, id) => [{ type: "Vocab", id }],
    }),
    createVocab: builder.mutation<any, {
      originalInput?: string;
      source?: string;
      tags?: string[];
      isManual?: boolean;
      correctedWord?: string;
      meaningVi?: string;
      meaningEn?: string;
      pronunciationUK?: string;
      pronunciationUS?: string;
      partOfSpeech?: string;
      level?: string;
      category?: string;
      examples?: Array<{ sentence: string; translation: string }>;
      aiModel?: string;
    }>({
      query: (body) => ({
        url: "/vocab",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Vocab", id: "LIST" },
        { type: "Vocab", id: "METADATA" },
      ],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data: response } = await queryFulfilled;
          if (response?.success && response?.data) {
            // Cập nhật bộ nhớ đệm getVocabs cho cả 2 định dạng serialize tham số khác nhau
            dispatch(
              vocabApi.util.updateQueryData("getVocabs", { page: 1, limit: 10000 }, (draft) => {
                if (draft && Array.isArray(draft.data)) {
                  const exists = draft.data.some((item: any) => item._id === response.data._id);
                  if (!exists) {
                    draft.data.unshift(response.data);
                  }
                }
              })
            );
            dispatch(
              vocabApi.util.updateQueryData("getVocabs", { page: 1, limit: 10000, keyword: undefined }, (draft) => {
                if (draft && Array.isArray(draft.data)) {
                  const exists = draft.data.some((item: any) => item._id === response.data._id);
                  if (!exists) {
                    draft.data.unshift(response.data);
                  }
                }
              })
            );
          }
        } catch (err) {
          console.error("Lỗi cập nhật cache pessimistic:", err);
        }
      },
    }),
    updateVocab: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({
        url: `/vocab/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Vocab", id: "LIST" },
        { type: "Vocab", id },
        { type: "Vocab", id: "METADATA" },
      ],
    }),
    deleteVocab: builder.mutation<any, string>({
      query: (id) => ({
        url: `/vocab/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: "Vocab", id: "LIST" },
        { type: "Vocab", id: "METADATA" },
      ],
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        // Cập nhật optimistic (xóa ngay lập tức trên UI)
        const patchResult1 = dispatch(
          vocabApi.util.updateQueryData("getVocabs", { page: 1, limit: 10000 }, (draft) => {
            if (draft && Array.isArray(draft.data)) {
              draft.data = draft.data.filter((item: any) => item._id !== id);
            }
          })
        );
        const patchResult2 = dispatch(
          vocabApi.util.updateQueryData("getVocabs", { page: 1, limit: 10000, keyword: undefined }, (draft) => {
            if (draft && Array.isArray(draft.data)) {
              draft.data = draft.data.filter((item: any) => item._id !== id);
            }
          })
        );
        try {
          await queryFulfilled;
        } catch (err) {
          // Hoàn tác nếu cuộc gọi API thực tế thất bại
          patchResult1.undo();
          patchResult2.undo();
        }
      },
    }),
    getVocabMetadata: builder.query<any, void>({
      query: () => "/vocab/metadata",
      providesTags: () => [{ type: "Vocab", id: "METADATA" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetVocabsQuery,
  useGetVocabByIdQuery,
  useCreateVocabMutation,
  useUpdateVocabMutation,
  useDeleteVocabMutation,
  useGetVocabMetadataQuery,
} = vocabApi;
