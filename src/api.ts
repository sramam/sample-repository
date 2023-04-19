import { Oso } from "oso";
import { Model, Session } from "./model";

export function createApi(oso: Oso, model: Model) {
  const { users, classrooms } = model;
  async function add_tutor({
    classroom: classroomId,
    teacher: teacherEmail,
    tutor: tutorEmail,
  }: {
    classroom: string;
    teacher: string;
    tutor: string;
  }): Promise<string> {
    const teacher = users.find((user) => user.email === teacherEmail);
    const classroom = classrooms.find(
      (classroom) => classroom.id === classroomId
    );

    if (!teacher || !classroom) return "add_tutor: Invalid data";

    if (await oso.isAllowed(teacher, "add_tutor", classroom)) {
      classroom.tutorEmail = tutorEmail;
      return `SUCCESS: add_tutor ${tutorEmail} by ${teacherEmail} to ${classroomId}`;
    } else {
      return `FAILED: add_tutor ${tutorEmail} by ${teacherEmail} to ${classroomId}`;
    }
  }

  async function create_session({
    classroom: classroomId,
    requestor: reqEmail,
  }: {
    classroom: string;
    requestor: string;
  }): Promise<string> {
    const requestor = users.find((user) => user.email === reqEmail);
    const classroom = classrooms.find(
      (classroom) => classroom.id === classroomId
    );
    if (!requestor || !classroom) return "create_session: Invalid data";

    if (await oso.isAllowed(requestor, "create_session", classroom)) {
      // Assuming a simple in-memory store for sessions as well.
      const session = new Session(classroomId, reqEmail);
      model.sessions.push(session);
      // Replace this with your session storage logic.
      return `SUCCESS: create_session by ${reqEmail} to ${classroomId}`;
    } else {
      return `FAILED: create_session by ${reqEmail} to ${classroomId}`;
    }
  }

  return {
    add_tutor,
    create_session,
  };
}
