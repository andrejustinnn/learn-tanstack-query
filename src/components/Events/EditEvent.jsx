import {
  Link,
  redirect,
  useNavigate,
  useNavigation,
  useParams,
  useSubmit,
} from "react-router-dom";

import Modal from "../UI/Modal.jsx";
import EventForm from "./EventForm.jsx";
import { useQuery } from "@tanstack/react-query";
import { updateEvent, fetchEvent, queryClient } from "../../util/http.js";
// import LoadingIndicator from "../UI/LoadingIndicator.jsx";
import ErrorBlock from "../UI/ErrorBlock.jsx";

export default function EditEvent() {
  const navigate = useNavigate();
  const { state } = useNavigation(); // ini hooks untuk kasih informasi tambahan aja sih seperti idle, loading, submitting
  const submit = useSubmit(); // ini hooks untuk submit form, jadi gak perlu lagi bikin handleSubmit
  const { id } = useParams();

  const { data, isError, error } = useQuery({
    queryKey: ["events", { id }], // ini lgsg reuse data yang di fetch di eventdetails
    queryFn: ({ signal }) => fetchEvent({ signal, id }),
    staleTime: 10000, // ini untuk avoid dimana casenya kita baru fetch data terbaru mengunakan loader, tp saat halaman ini kerender malah ke initiate lg. makana ditambahkan stale biar avoid behavior sprti itu
  });

  // const { mutate } = useMutation({
  //   mutationFn: updateEvent,
  //   onMutate: async (data) => {
  //     // akan di execute ketika mutate() dijalankan dan sblm proses selesai
  //     //OPTIMISTIC UPDATE
  //     const newEvent = data.event;
  //     // param data ini adalah data yang diinputkan di param mutate()
  //     await queryClient.cancelQueries({ queryKey: ["events", { id }] }); // cancelQueries untuk membatalkan query yang sedang berjalan karena
  //     // jika  tidak cancel query, data yang di update akan di revalidate dan data yang lama akan di tampilkan yang di trigger oleh useQuery
  //     const prevEvent = queryClient.getQueryData(["events", { id }]); // getQueryData untuk mengambil data dari cache
  //     queryClient.setQueryData(["events", { id }], newEvent); // setQueryData untuk update data di cache dengan cara memanipulasi

  //     return { prevEvent }; // return data yang mau di pass ke onSuccess atau onError
  //   },
  //   onError: (error, variables, context) => {
  //     // akan di execute ketika error
  //     queryClient.setQueryData(["events", { id }], context.prevEvent); // rollback data ke data sebelumnya
  //   },
  //   onSettled: () => {
  //     // akan di execute ketika proses mutate selesai baik itu success atau error
  //     queryClient.invalidateQueries({ queryKey: ["events", { id }] }); // invalidateQueries untuk spesifik id aja
  //   },
  // });

  function handleSubmit(formData) {
    // // param pertama adalah data yang mau di update, param kedua adalah object yang berisi onSuccess, onError, onSettled
    // // param pertama sesuai dengan mutationFn yang ada di useMutation
    // mutate({ id, event: formData });
    // navigate("../"); // naik 1 tingkat
    submit(formData, { method: "PUT" }); // krna hanya non get method yang bisa perform action()
    // ini trigger action function dibawahhh
  }

  function handleClose() {
    navigate("../");
  }

  let content;

  // if (isPending) { // ini sebenarnya udah gaberguna lagi krna pakai loader dimana menunggu fetchQuery selesai baru kerender
  //   content = (
  //     <div className="center">
  //       <LoadingIndicator />
  //     </div>
  //   );
  // }

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
        {state === "submitting" ? (
          "Submitting data..."
        ) : (
          <>
            <Link to="../" className="button-text">
              Cancel
            </Link>
            <button type="submit" className="button">
              Update
            </button>
          </>
        )}
      </EventForm>
    );
  }

  return <Modal onClose={handleClose}>{content}</Modal>;
}

export function loader({ params }) {
  // promise jd nunggu selesai dlu baru kerender componentnya
  // fetchQUery ini sm ky useQUery tp krna use query itu hooks dan rule of hooks, maka kita gak bisa pake hooks di luar component
  // maka kita dibantu oleh queryClient.fetchQuery untuk fetch data di luar component
  return queryClient.fetchQuery({
    queryKey: ["events", { id: params.id }], // ini lgsg reuse data yang di fetch di eventdetails
    queryFn: ({ signal, queryKey }) => fetchEvent({ signal, ...queryKey[1] }),
  });
  // walaupun sudha pkai loader
  // hooks di komponen use QUery tidak dihapus

  // krna flownya
  // loader dijalankan fetch query akan nge cache datanya
  // saat komponen menjalankan usequery, data akan diambil dari cache
  // dan juga advantagenya disaat kita navigate ke halaman ini, data akan di fetch ulang by useQuery
}

export async function action({ request, params }) {
  const formData = await request.formData();
  const updatedEventData = Object.fromEntries(formData); // convert formData yang complex manjadi object simple

  await updateEvent({ id: params.id, event: updatedEventData });
  await queryClient.invalidateQueries(["events"]);
  return redirect("../");
  // kenapa beda dengan hooks mutate,
  // karena simpelnya hooks tersebut merupakan wrapper dari mutationFn yang di pass ke useMutation
}
