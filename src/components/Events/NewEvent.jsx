import { Link, useNavigate } from "react-router-dom";

import Modal from "../UI/Modal.jsx";
import EventForm from "./EventForm.jsx";
import { useMutation } from "@tanstack/react-query";
import { createNewEvent, queryClient } from "../../util/http.js";
import ErrorBlock from "../UI/ErrorBlock.jsx";

export default function NewEvent() {
  const navigate = useNavigate();
  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: createNewEvent,
  }); // sbnrnya pakai useQuery bisa untuk post data tp, mutation udah optimize, dan galgsg ke execute seperti useQuery saat pertama kali render

  function handleSubmit(formData) {
    mutate(
      { event: formData },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["events"] }); // invalidateQueries untuk mereload data, karena data yg baru di post belum ada di cache
          // buat key ini akan revalidate dengan refetching
          // queryClient.invalidateQueries({ queryKey: ["events"], exact: true });
          // exact true ini untuk selector yg lebih spesifik karena kalau gapake atau exactnya false, semua queryKey yang ada 'events' akan di reexecuted. contoh query key yang ['events', 'blablbal']
          // tapi di case ini gak pake exact krna ada queryKey pada halman findeventsection yang juga butuh di revalidate datanya. krna klo gak nanti data yang baru gamuncul di searchnya
          navigate("../");
        },
      }
    );
  }

  return (
    <Modal onClose={() => navigate("../")}>
      <EventForm onSubmit={handleSubmit}>
        {isPending && "Submitting..."}
        {!isPending && (
          <>
            <Link to="../" className="button-text">
              Cancel
            </Link>
            <button type="submit" className="button">
              Create
            </button>
          </>
        )}
      </EventForm>
      {isError && (
        <ErrorBlock
          title="Failed to create event"
          message={
            error.info?.message ||
            "Failed to crate event. Please check your inputs and try again later. "
          }
        />
      )}
    </Modal>
  );
}
