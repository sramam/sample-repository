allow(actor: User, "add_tutor", classroom: Classroom) if
  actor.role = "teacher" and
  classroom.teacherEmail = actor.email;

allow(actor: User, "create_session", classroom: Classroom) if
  (classroom.tutorEmail = actor.email or classroom.teacherEmail = actor.email);