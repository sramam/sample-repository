export class User {
  constructor(public email: string, public role: string) {}
}

export class Classroom {
  constructor(
    public id: string,
    public teacherEmail: string,
    public tutorEmail?: string
  ) {}
}

export class Session {
  constructor(public classroom: string, public tutor: string) {}
}

// model serves as our in-memory database.
export const model = {
  users: [
    new User("white@example.com", "teacher"),
    new User("hayes@example.com", "teacher"),
    new User("grady@example.com", "tutor"),
    new User("roberts@example.com", "tutor"),
  ],
  classrooms: [
    new Classroom("English", "white@example.com"),
    new Classroom("Math", "hayes@example.com"),
  ],
  sessions: [] as Session[],
};

export type Model = typeof model;
