import LoadingIndicator from "../UI/LoadingIndicator.jsx";
import ErrorBlock from "../UI/ErrorBlock.jsx";
import EventItem from "./EventItem.jsx";
import { useQuery } from "@tanstack/react-query";
import { fetchEvents } from "../../util/http.js";

export default function NewEventsSection() {
  // data is the result or return from the queryFn
  // isPending is a boolean that indicates if the query is still pending
  // isError is a boolean that indicates if the query has failed, tp harus di throw dulu di queryFn
  // error is the error object that was thrown in the queryFn
  // jadi kalau misalnya berhasil masuk ke data, kalau gagal masuk ke error

  // ADVANTAGES OF USING REACT QUERY
  // 1. Automatic caching
  // 2. Automatic refetching
  // 3. Automatic stale state management

  const {
    data,
    isPending: isLoading,
    isError,
    error,
  } = useQuery({
    // fetch events will be executed by useQuery
    // queryKey: ["events"], // unique key for the query, for caching
    queryKey: ["events", { max: 3 }], //ini punya alternatif bisa lgsg pass query key ke query function
    queryFn: ({ signal, queryKey }) => fetchEvents({ signal, ...queryKey[1] }), // function that return a promise
    // react query by default pass data jadi search termnya kedeteksi sebuah object.
    // staleTime: 0, // selalu request behind the scene untuk updated data
    staleTime: 5000, // jadi saat pindah halaman, dan kembali lagi ke halaman ini, data akan di fetch ulang setelah 5 detik
    // gcTime: 60000, // garbage collection time, data yg sudah tidak terpakai akan dihapus in certain time
  });

  let content;

  if (isLoading) {
    content = <LoadingIndicator />;
  }

  if (isError) {
    content = (
      <ErrorBlock
        title="An error occurred!"
        message={error.info?.message || "Failed to fetch events"}
      />
    ); // ini property yg di set saat throw error di fetchEvents
  }

  if (data) {
    content = (
      <ul className="events-list">
        {data.map((event) => (
          <li key={event.id}>
            <EventItem event={event} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section className="content-section" id="new-events-section">
      <header>
        <h2>Recently added events</h2>
      </header>
      {content}
    </section>
  );
}
