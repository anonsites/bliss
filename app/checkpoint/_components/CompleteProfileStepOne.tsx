import styles from "../checkpoint.module.css";
import {
  type GenderOption,
  genderOptions,
  parseAge,
  type StepOneErrors,
} from "./profile-utils";

type CompleteProfileStepOneProps = {
  username: string;
  age: string;
  gender: GenderOption | undefined;
  errors: StepOneErrors;
  onUpdate: (data: { username?: string; age?: string; gender?: GenderOption }) => void;
  onErrorsChange: (errors: StepOneErrors) => void;
  onNext: () => void;
  onBack: () => void;
  onCancel: () => void;
};

export function CompleteProfileStepOne({
  username,
  age,
  gender,
  errors,
  onUpdate,
  onErrorsChange,
  onNext,
  onBack,
  onCancel,
}: CompleteProfileStepOneProps) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: StepOneErrors = {};
    const trimmedUsername = username.trim();
    const parsedAge = parseAge(age);

    if (trimmedUsername.length < 3) {
      nextErrors.username = "Username must be at least 3 characters.";
    }

    if (parsedAge === null) {
      nextErrors.age = "Enter a valid age between 18 and 120.";
    }

    if (!gender) {
      nextErrors.gender = "Choose a gender to continue.";
    }

    onErrorsChange(nextErrors);

    if (Object.keys(nextErrors).length === 0) {
      onNext();
    }
  };

  return (
    <form className={`modal-form ${styles["complete-profile__form"]}`} onSubmit={handleSubmit}>
        <div className={styles["complete-profile__field-row"]}>
          <label className={styles["complete-profile__label"]} htmlFor="complete-profile-username">
            Username:
          </label>
          <input
            id="complete-profile-username"
            maxLength={24}
            onChange={(event) => {
              onUpdate({ username: event.target.value });
              onErrorsChange({ ...errors, username: undefined });
            }}
            placeholder="Enter your username"
            type="text"
            value={username}
            className={styles["complete-profile__input-underline"]}
          />
        </div>
        {errors.username ? <p className={styles["complete-profile__error"]}>{errors.username}</p> : null}

        <div className={styles["complete-profile__field-row"]}>
          <label className={styles["complete-profile__label"]} htmlFor="complete-profile-age">
            Age:
          </label>
          <input
            id="complete-profile-age"
            inputMode="numeric"
            onChange={(event) => {
              onUpdate({ age: event.target.value });
              onErrorsChange({ ...errors, age: undefined });
            }}
            placeholder="Enter your age"
            type="number"
            value={age}
            className={styles["complete-profile__input-underline"]}
          />
        </div>
        {errors.age ? <p className={styles["complete-profile__error"]}>{errors.age}</p> : null}

        <div className={styles["complete-profile__field-row"]}>
          <span className={styles["complete-profile__label"]}>Gender:</span>
          <div className={styles["complete-profile__gender-row"]}>
            {genderOptions.map((option) => {
              const isSelected = gender === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    onUpdate({ gender: isSelected ? undefined : option });
                    onErrorsChange({ ...errors, gender: undefined });
                  }}
                  className={`${styles["complete-profile__gender-btn"]} ${isSelected ? styles["is-active"] : ""}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
        {errors.gender ? <p className={styles["complete-profile__error"]}>{errors.gender}</p> : null}

        <div className={styles["complete-profile__footer-buttons"]}>
          <button className={styles["complete-profile__button-primary"]} type="submit">
            Continue
          </button>
        </div>
      </form>
  );
}
