import { Link, useNavigate, useParams } from "react-router-dom";

import Modal from "../UI/Modal.jsx";
import EventForm from "./EventForm.jsx";
import { useMutation, useQuery } from "@tanstack/react-query";
import { updateEvent, fetchEvent, queryClient } from "../../util/http.js";
// import LoadingIndicator from "../UI/LoadingIndicator.jsx";
import ErrorBlock from "../UI/ErrorBlock.jsx";
import LoadingIndicator from "../UI/LoadingIndicator.jsx";

export default function EditEvent() {
  const navigate = useNavigate();
  const { id } = useParams();

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["events", { id }], // ini lgsg reuse data yang di fetch di eventdetails
    queryFn: ({ signal }) => fetchEvent({ signal, id }),
  });

  const { mutate } = useMutation({
    mutationFn: updateEvent,
    onMutate: async (data) => {
      // akan di execute ketika mutate() dijalankan dan sblm proses selesai
      //OPTIMISTIC UPDATE
      const newEvent = data.event;
      // param data ini adalah data yang diinputkan di param mutate()
      await queryClient.cancelQueries({ queryKey: ["events", { id }] }); // cancelQueries untuk membatalkan query yang sedang berjalan karena
      // jika  tidak cancel query, data yang di update akan di revalidate dan data yang lama akan di tampilkan yang di trigger oleh useQuery
      const prevEvent = queryClient.getQueryData(["events", { id }]); // getQueryData untuk mengambil data dari cache
      queryClient.setQueryData(["events", { id }], newEvent); // setQueryData untuk update data di cache dengan cara memanipulasi

      return { prevEvent }; // return data yang mau di pass ke onSuccess atau onError
    },
    onError: (error, variables, context) => {
      // akan di execute ketika error
      queryClient.setQueryData(["events", { id }], context.prevEvent); // rollback data ke data sebelumnya
    },
    onSettled: () => {
      // akan di execute ketika proses mutate selesai baik itu success atau error
      queryClient.invalidateQueries({ queryKey: ["events", { id }] }); // invalidateQueries untuk spesifik id aja
    },
  });

  function handleSubmit(formData) {
    // param pertama adalah data yang mau di update, param kedua adalah object yang berisi onSuccess, onError, onSettled
    // param pertama sesuai dengan mutationFn yang ada di useMutation
    mutate({ id, event: formData });
    navigate("../"); // naik 1 tingkat
  }

  function handleClose() {
    navigate("../");
  }

  let content;

  if (isPending) {
    // ini sebenarnya udah gaberguna lagi krna pakai loader dimana menunggu fetchQuery selesai baru kerender
    content = (
      <div className="center">
        <LoadingIndicator />
      </div>
    );
  }

  if (isError) {
    // ini sebenarnya udah gaberguna lagi krna kita bisa manfaatin error mechanism dari react rouuter
    content = (
      <>
        <ErrorBlock
          title="Failed to load event"
          message={
            error.info?.message ||
            "Failed to load event, please check your inputs and try again."
          }
        />
        <div className="form-actions">
          <Link to="../" className="button">
            Okay
          </Link>
        </div>
      </>
    );
  }

  if (data) {
    content = (
      <EventForm inputData={data} onSubmit={handleSubmit}>
        <Link to="../" className="button-text">
          Cancel
        </Link>
        <button type="submit" className="button">
          Update
        </button>
      </EventForm>
    );
  }

  return <Modal onClose={handleClose}>{content}</Modal>;
}
