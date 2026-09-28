interface SearchBoxProps {
  action?: string;
  defaultValue?: string;
  category?: string;
  placeholder?: string;
}

export function SearchBox({
  action = "/transactions",
  defaultValue = "",
  category,
  placeholder = "مثلاً: نبي نجدد جواز السفر",
}: SearchBoxProps) {
  return (
    <form
      role="search"
      action={action}
      method="GET"
      className="mx-auto flex w-full max-w-xl flex-col gap-3 sm:flex-row"
    >
      {category && <input type="hidden" name="category" value={category} />}
      <label htmlFor="transaction-search" className="sr-only">
        ابحث عن معاملة
      </label>
      <input
        id="transaction-search"
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-full border border-zinc-300 bg-white px-5 py-3 text-base text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
      />
      <button
        type="submit"
        className="rounded-full bg-teal-700 px-6 py-3 text-base font-semibold text-white transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
      >
        ابحث عن المعاملة
      </button>
    </form>
  );
}
