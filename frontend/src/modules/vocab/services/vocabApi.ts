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
