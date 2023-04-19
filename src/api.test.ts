import { Oso } from "oso";
import { createApi } from "./api";
import { initializeOso } from "./initializeOso";
import { model } from "./model";

describe("API Workflow", () => {
  let api: ReturnType<typeof createApi>;
  let oso: Oso;
  const messages: string[] = [];
  beforeEach(async () => {
    oso = await initializeOso();
    api = createApi(oso, model);
  });

  test("API Workflow", async () => {
    const { add_tutor, create_session } = api;

    messages.push(``);
    messages.push("// teacher adding tutor ro assigned classroom");
    messages.push(
      await add_tutor({
        classroom: "English",
        teacher: "white@example.com",
        tutor: "grady@example.com",
      })
    );
    messages.push(
      await add_tutor({
        classroom: "Math",
        teacher: "hayes@example.com",
        tutor: "roberts@example.com",
      })
    );

    messages.push(``);
    messages.push(`// teacher adding tutor to unassigned classroom`);
    messages.push(
      await add_tutor({
        classroom: "Math",
        teacher: "white@example.com",
        tutor: "grady@example.com",
      })
    );

    messages.push(``);
    messages.push(
      `// tutors can create_sessions for classes they have been added to`
    );
    messages.push(
      await create_session({
        classroom: "English",
        requestor: "grady@example.com",
      })
    );
    messages.push(
      await create_session({
        classroom: "Math",
        requestor: "roberts@example.com",
      })
    );

    messages.push(``);
    messages.push(`// teachers can create_sessions`);
    messages.push(
      await create_session({
        classroom: "English",
        requestor: "white@example.com",
      })
    );
    messages.push(
      await create_session({
        classroom: "Math",
        requestor: "hayes@example.com",
      })
    );

    messages.push(``);
    messages.push(
      `// teachers/tutors cannot create_sessions for classes they have NOT been added to`
    );
    messages.push(
      await create_session({
        classroom: "English",
        requestor: "roberts@example.com",
      })
    );
    messages.push(
      await create_session({
        classroom: "Math",
        requestor: "white@example.com",
      })
    );

    messages.push(``);
    messages.push(
      `// using teachers/tutors unknown to the system (for coverage)`
    );
    messages.push(
      await add_tutor({
        classroom: "Math",
        teacher: "alice@example.com",
        tutor: "roberts@example.com",
      })
    );
    messages.push(
      await create_session({
        classroom: "English",
        requestor: "alice@example.com",
      })
    );

    console.log(messages.join("\n"));

    expect({ messages, model }).toMatchInlineSnapshot(`
{
  "messages": [
    "",
    "// teacher adding tutor ro assigned classroom",
    "SUCCESS: add_tutor grady@example.com by white@example.com to English",
    "SUCCESS: add_tutor roberts@example.com by hayes@example.com to Math",
    "",
    "// teacher adding tutor to unassigned classroom",
    "FAILED: add_tutor grady@example.com by white@example.com to Math",
    "",
    "// tutors can create_sessions for classes they have been added to",
    "SUCCESS: create_session by grady@example.com to English",
    "SUCCESS: create_session by roberts@example.com to Math",
    "",
    "// teachers can create_sessions",
    "SUCCESS: create_session by white@example.com to English",
    "SUCCESS: create_session by hayes@example.com to Math",
    "",
    "// teachers/tutors cannot create_sessions for classes they have NOT been added to",
    "FAILED: create_session by roberts@example.com to English",
    "FAILED: create_session by white@example.com to Math",
    "",
    "// using teachers/tutors unknown to the system (for coverage)",
    "add_tutor: Invalid data",
    "create_session: Invalid data",
  ],
  "model": {
    "classrooms": [
      Classroom {
        "id": "English",
        "teacherEmail": "white@example.com",
        "tutorEmail": "grady@example.com",
      },
      Classroom {
        "id": "Math",
        "teacherEmail": "hayes@example.com",
        "tutorEmail": "roberts@example.com",
      },
    ],
    "sessions": [
      Session {
        "classroom": "English",
        "tutor": "grady@example.com",
      },
      Session {
        "classroom": "Math",
        "tutor": "roberts@example.com",
      },
      Session {
        "classroom": "English",
        "tutor": "white@example.com",
      },
      Session {
        "classroom": "Math",
        "tutor": "hayes@example.com",
      },
    ],
    "users": [
      User {
        "email": "white@example.com",
        "role": "teacher",
      },
      User {
        "email": "hayes@example.com",
        "role": "teacher",
      },
      User {
        "email": "grady@example.com",
        "role": "tutor",
      },
      User {
        "email": "roberts@example.com",
        "role": "tutor",
      },
    ],
  },
}
`);
  });
});
