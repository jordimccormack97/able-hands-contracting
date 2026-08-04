import { useMemo, useState, type FormEvent } from "react";
import { CheckCircle2, ImagePlus, X } from "lucide-react";
import { Button } from "./ui/button";

const inputClass =
  "w-full rounded-[1.5rem] border border-black/10 bg-[#faf7f2] px-5 py-4 text-sm outline-none focus:border-black/25 transition";
const selectClass =
  "w-full rounded-[1.5rem] border border-black/10 bg-[#faf7f2] px-5 py-4 text-sm outline-none focus:border-black/25 transition appearance-none";
const labelClass = "block text-xs font-medium text-black/50 mb-1.5 ml-1";
const MAX_PHOTO_SIZE = 10 * 1024 * 1024;
const MAX_PHOTOS = 5;

const SERVICE_TYPES = [
  "Fencing",
  "Decks",
  "Carpentry",
  "Punch List Items",
  "Home Repairs",
  "Other",
] as const;

interface ContactFormProps {
  calendlyUrl: string;
}

function getSource(): string {
  const params = new URLSearchParams(window.location.search);
  if (params.get("src") === "qr") return "qr";
  return "web";
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[] | string[];
  placeholder: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className={labelClass}>
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <select
        className={selectClass}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ContactForm({ calendlyUrl }: ContactFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [projectSummary, setProjectSummary] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const source = useMemo(getSource, []);

  function handlePhotoChange(fileList: FileList | null) {
    setErrorMsg("");
    if (!fileList) return;

    const selected = Array.from(fileList);
    const validPhotos: File[] = [];

    for (const file of selected) {
      if (!file.type.startsWith("image/")) {
        setErrorMsg("Please upload image files only.");
        continue;
      }
      if (file.size > MAX_PHOTO_SIZE) {
        setErrorMsg("Each photo must be 10MB or less.");
        continue;
      }
      validPhotos.push(file);
    }

    setPhotos((current) => [...current, ...validPhotos].slice(0, MAX_PHOTOS));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = "Name is required";
    if (!email.trim()) errors.email = "Email is required";
    if (!phone.trim()) errors.phone = "Phone is required";
    if (!zipCode.trim()) errors.zipCode = "ZIP code is required";
    if (!serviceType) errors.serviceType = "Please select a service";
    if (!projectSummary.trim() || projectSummary.trim().length < 20) {
      errors.projectSummary = "Please describe your project in at least 20 characters";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setStatus("submitting");

    try {
      const formData = new FormData();
      formData.append("form-name", "estimate");
      formData.append("name", name.trim());
      formData.append("email", email.trim());
      formData.append("phone", phone.trim());
      formData.append("zipCode", zipCode.trim());
      formData.append("serviceType", serviceType);
      formData.append("projectSummary", projectSummary.trim());
      formData.append("source", source);
      formData.append("website", website);
      photos.forEach((photo) => formData.append("photos", photo, photo.name));

      const res = await fetch("/", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Submission failed");
      }

      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "success") {
    return (
      <div className="mt-8 flex flex-col items-center gap-4 rounded-[2rem] border border-green-200 bg-green-50 p-10 text-center">
        <CheckCircle2 className="h-10 w-10 text-green-600" />
        <h3 className="text-xl font-medium text-green-900">Thank you!</h3>
        <p className="max-w-md text-sm text-green-800">
          Your request has been submitted. We'll be in touch within one business day.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-2"
          onClick={() => {
            setStatus("idle");
            setName("");
            setEmail("");
            setPhone("");
            setZipCode("");
            setServiceType("");
            setProjectSummary("");
            setPhotos([]);
          }}
        >
          Submit Another Request
        </Button>
      </div>
    );
  }

  return (
    <form
      className="mt-8 space-y-4"
      name="estimate"
      method="POST"
      data-netlify="true"
      data-netlify-honeypot="website"
      encType="multipart/form-data"
      onSubmit={handleSubmit}
      noValidate
    >
      <input type="hidden" name="form-name" value="estimate" />
      <input type="hidden" name="source" value={source} />
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, overflow: "hidden" }}>
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>

      <div>
        <label className={labelClass}>Full Name <span className="text-red-400">*</span></label>
        <input className={inputClass} name="name" placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} required />
        {fieldErrors.name && <p className="mt-1 ml-1 text-xs text-red-500">{fieldErrors.name}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Email <span className="text-red-400">*</span></label>
          <input className={inputClass} name="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          {fieldErrors.email && <p className="mt-1 ml-1 text-xs text-red-500">{fieldErrors.email}</p>}
        </div>
        <div>
          <label className={labelClass}>Phone <span className="text-red-400">*</span></label>
          <input className={inputClass} name="phone" type="tel" placeholder="(919) 555-0123" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          {fieldErrors.phone && <p className="mt-1 ml-1 text-xs text-red-500">{fieldErrors.phone}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Project ZIP Code <span className="text-red-400">*</span></label>
          <input className={inputClass} name="zipCode" placeholder="27514" value={zipCode} onChange={(e) => setZipCode(e.target.value)} required maxLength={10} />
          {fieldErrors.zipCode && <p className="mt-1 ml-1 text-xs text-red-500">{fieldErrors.zipCode}</p>}
        </div>
        <SelectField label="Service Type" name="serviceType" value={serviceType} onChange={setServiceType} options={SERVICE_TYPES} placeholder="Select a service..." required />
      </div>
      {fieldErrors.serviceType && <p className="-mt-2 ml-1 text-xs text-red-500">{fieldErrors.serviceType}</p>}

      <div>
        <label className={labelClass}>Project Summary <span className="text-red-400">*</span></label>
        <textarea
          className={`min-h-[120px] ${inputClass}`}
          name="projectSummary"
          placeholder="Briefly describe what you need done."
          value={projectSummary}
          onChange={(e) => setProjectSummary(e.target.value)}
          required
          maxLength={1000}
        />
        {fieldErrors.projectSummary && <p className="mt-1 ml-1 text-xs text-red-500">{fieldErrors.projectSummary}</p>}
      </div>

      <div>
        <label className={labelClass}>Project Photos</label>
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[1.5rem] border border-dashed border-black/15 bg-[#faf7f2] px-5 py-6 text-center transition hover:border-black/25">
          <ImagePlus className="h-5 w-5 text-black/45" />
          <span className="text-sm font-medium text-black/65">Add photos</span>
          <span className="text-xs leading-5 text-black/40">
            Upload up to {MAX_PHOTOS} photos, 10MB each.
          </span>
          <input
            className="sr-only"
            name="photos"
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              handlePhotoChange(e.target.files);
              e.target.value = "";
            }}
          />
        </label>

        {photos.length > 0 && (
          <div className="mt-3 grid gap-2">
            {photos.map((photo, index) => (
              <div key={`${photo.name}-${photo.lastModified}`} className="flex items-center justify-between gap-3 rounded-2xl bg-black/[0.03] px-4 py-3 text-sm text-black/60">
                <span className="truncate">{photo.name}</span>
                <button
                  type="button"
                  className="rounded-full p-1 text-black/35 transition hover:bg-black/5 hover:text-black/60"
                  aria-label={`Remove ${photo.name}`}
                  onClick={() => setPhotos((current) => current.filter((_, i) => i !== index))}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {errorMsg && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{errorMsg}</p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button className="w-full sm:w-auto" type="submit" disabled={status === "submitting"}>
          {status === "submitting" ? "Submitting…" : "Request Estimate"}
        </Button>
        <Button asChild className="w-full sm:w-auto" type="button" variant="outline">
          <a href={calendlyUrl} target="_blank" rel="noopener noreferrer">
            Place Job Request
          </a>
        </Button>
      </div>
    </form>
  );
}
