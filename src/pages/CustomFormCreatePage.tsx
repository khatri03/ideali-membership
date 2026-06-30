import {
  DndContext,
  DragOverlay,
  closestCenter,
} from "@dnd-kit/core";
import {
  rectSortingStrategy,
  SortableContext,
} from "@dnd-kit/sortable";
import { CircleHelp } from "lucide-react";
import { Link } from "react-router-dom";
import { MultiSelectInput } from "../components/inputs/MultiSelectInput/MultiSelectInput";
import {
  ControlPaletteItem,
  DragGhost,
  FieldPreview,
  PreviewFormCanvas,
  SelectFieldPreview,
  SortableFieldCard,
  ToggleField,
} from "./CustomFormCreatePage.parts";
import { APP_ROUTES } from "../routes";
import {
  CONTROL_ICON_MAP,
  getDefaultMultiSelectValues,
  getLayoutPresetLabel,
  getPreviewColumnSpan,
  normalizeLayoutColumn,
  toSentenceCase,
  toggleAcceptedFileType,
} from "./CustomFormCreatePage.helpers";
import { useCustomFormCreatePage } from "./CustomFormCreatePage.hook";


export function CustomFormCreatePage() {
  const {
    controls,
    isLoadingControls,
    controlsError,
    controlSearch,
    setControlSearch,
    draft,
    setDraft,
    fields,
    selectedFieldId,
    setSelectedFieldId,
    activeDragItem,
    isCanvasTargeted,
    isClearConfirmOpen,
    setIsClearConfirmOpen,
    isPreviewOpen,
    activeDragRect,
    fieldLayoutMenu,
    fieldLayoutMenuStyle,
    isSavingForm,
    isLoadingForm,
    loadError,
    saveError,
    isEditMode,
    isCompactViewport,
    selectedField,
    selectedControl,
    fieldToRemove,
    optionToRemove,
    selectedOption,
    previewColumnCount,
    controlUsageCounts,
    filteredControls,
    nameError,
    headerTextError,
    layoutColumnError,
    canvasFieldError,
    sensors,
    canvasRestrictModifier,
    setCanvasRef,
    isCanvasOver,
    canvasDropRef,
    inspectorLabelRef,
    handleSaveForm,
    onDragStart,
    onDragMove,
    onDragOver,
    onDragEnd,
    onDragCancel,
    appendFieldToCanvas,
    openPreview,
    closePreview,
    openFieldLayoutMenu,
    closeFieldLayoutMenu,
    setFieldLayoutPreset,
    clearFieldLayoutPreset,
    removeField,
    confirmRemoveField,
    cancelRemoveField,
    addOption,
    selectOption,
    setDefaultOption,
    removeOption,
    confirmRemoveOption,
    cancelRemoveOption,
    clearAllCanvasFields,
    updateSelectedField,
    updateOption,
  } = useCustomFormCreatePage();

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-4 shadow-sm sm:p-5 lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
              Custom Form Designer
            </p>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
              {isEditMode ? "Edit custom form" : "Design a custom form"}
            </h1>
            <p className="mt-3 text-slate-600">
              {isEditMode
                ? "Update the existing form, keep field identity stable, and publish the revised structure."
                : "Drag field types from the palette, arrange them on the canvas, and tune the constraints in the inspector."}
            </p>
          </div>

          <Link
            to={APP_ROUTES.customForms}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Back to forms list
          </Link>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-500">
            {loadError ? (
              <span className="text-rose-600">{loadError}</span>
            ) : saveError ? (
              <span className="text-rose-600">{saveError}</span>
            ) : (
              "Ready to save."
            )}
          </div>
          <button
            type="button"
            onClick={handleSaveForm}
            disabled={isSavingForm || isLoadingForm || Boolean(loadError)}
            className="inline-flex items-center justify-center rounded-full bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSavingForm ? (isEditMode ? "Saving..." : "Creating...") : isEditMode ? "Save changes" : "Create"}
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <FieldPreview
            title="Name"
            value={draft.name}
            onChange={(value) => setDraft((current) => ({ ...current, name: value }))}
            placeholder="Membership enrollment form"
            required
            error={nameError}
          />
          <FieldPreview
            title="Header Text"
            value={draft.headerText}
            onChange={(value) => setDraft((current) => ({ ...current, headerText: value }))}
            placeholder="Tell us a little about you"
            required
            error={headerTextError}
          />
          <FieldPreview
            title="Description"
            value={draft.description}
            onChange={(value) => setDraft((current) => ({ ...current, description: value }))}
            placeholder="Optional supporting copy"
          />
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
              <span>Layout Columns</span>
              <span className="text-sm font-bold leading-none text-rose-600" aria-label="Required" title="Required">
                *
              </span>
            </span>
            <select
              value={draft.layoutColumn}
              onChange={(event) =>
                setDraft((current) => ({ ...current, layoutColumn: Number(event.target.value) }))
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
            >
              {[1, 2, 3, 4].map((value) => (
                <option key={value} value={value}>
                  {value} column{value > 1 ? "s" : ""}
                </option>
              ))}
            </select>
            {layoutColumnError ? <p className="mt-2 text-xs font-medium text-rose-600">{layoutColumnError}</p> : null}
          </label>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_340px]">
          <aside className="space-y-4">
            <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-4 shadow-sm sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Field palette</h2>
                </div>
              </div>

              <div className="mt-4">
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Search field types
                  </span>
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
                    <span className="text-slate-400" aria-hidden="true">
                      /
                    </span>
                    <input
                      type="text"
                      value={controlSearch}
                      onChange={(event) => setControlSearch(event.target.value)}
                      placeholder="Search by name or type"
                      className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    />
                    {controlSearch ? (
                      <button
                        type="button"
                        onClick={() => setControlSearch("")}
                        className="rounded-full px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                      >
                        Clear
                      </button>
                    ) : null}
                  </div>
                </label>
              </div>

              <div className="mt-4 max-h-[24rem] space-y-3 overflow-y-auto pr-1 sm:max-h-[28rem] lg:max-h-[32rem]">
                {isLoadingControls ? (
                  <div className="space-y-3">
                    <div className="h-24 animate-pulse rounded-3xl bg-slate-100" />
                    <div className="h-24 animate-pulse rounded-3xl bg-slate-100" />
                    <div className="h-24 animate-pulse rounded-3xl bg-slate-100" />
                  </div>
                ) : controlsError ? (
                  <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                    {controlsError}
                  </div>
                ) : filteredControls.length > 0 ? (
                  filteredControls.map((control) => (
                    <ControlPaletteItem
                      key={control.id}
                      control={control}
                      count={controlUsageCounts.get(control.id) ?? 0}
                      icon={CONTROL_ICON_MAP[control.controlType.trim().toLowerCase()] ?? CircleHelp}
                      tooltip={`${control.name} â€¢ Double-click to add`}
                      onDoubleClick={appendFieldToCanvas}
                    />
                  ))
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                    {controls.length > 0
                      ? "No controls match your search."
                      : "No controls were returned by the backend."}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-cyan-100 bg-cyan-50/80 p-4 sm:p-5">
              <p className="text-sm font-semibold text-slate-900">Builder note</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Start with the core controls first. We can progressively add advanced settings,
                validation rules, and persistence after the structure is stable.
              </p>
            </div>
          </aside>
          <DragOverlay dropAnimation={null} modifiers={[canvasRestrictModifier]}>
            <DragGhost item={activeDragItem} rect={activeDragRect} />
          </DragOverlay>

            <main
              ref={setCanvasRef}
              className={[
                "flex min-h-0 flex-col rounded-[2rem] border bg-white/90 p-4 shadow-sm transition overflow-hidden lg:p-5",
                isCanvasOver || isCanvasTargeted
                  ? "border-cyan-400 ring-4 ring-cyan-100"
                  : "border-slate-200",
            ].join(" ")}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Form canvas</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Drop controls here and drag to reorder them.
                </p>
                {canvasFieldError ? (
                  <p className="mt-2 text-sm font-medium text-rose-600">{canvasFieldError}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                  {fields.length} field{fields.length === 1 ? "" : "s"}
                </span>
                <button
                  type="button"
                  onClick={openPreview}
                  disabled={fields.length === 0}
                  className="inline-flex items-center justify-center rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:hover:bg-slate-100"
                >
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => setIsClearConfirmOpen(true)}
                  disabled={fields.length === 0}
                  className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Clear all
                </button>
              </div>
            </div>

            <div className="mt-5 max-h-[40rem] overflow-y-auto pr-0 sm:max-h-[44rem] sm:pr-1 lg:max-h-[48rem]">
                <div
                  ref={canvasDropRef}
                  className={[
                    "min-h-[24rem] rounded-[2rem] border border-dashed bg-slate-50 p-3 transition sm:min-h-[28rem] sm:p-4 lg:min-h-[32rem]",
                    isCanvasOver || isCanvasTargeted
                      ? "border-cyan-400 bg-cyan-50/60 shadow-[0_0_0_1px_rgba(34,211,238,0.18)]"
                      : "border-slate-200",
                  ].join(" ")}
                >
                {isCanvasOver || isCanvasTargeted ? (
                  <div className="mb-4 rounded-2xl border border-cyan-200 bg-white/80 px-4 py-3 text-sm font-medium text-cyan-800">
                    Release to drop into the form canvas.
                  </div>
                ) : null}
                <SortableContext items={fields.map((field) => field.id)} strategy={rectSortingStrategy}>
                {fields.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
                    {fields.map((field) => (
                      <SortableFieldCard
                        key={field.id}
                        field={field}
                        span={getPreviewColumnSpan(field, previewColumnCount)}
                        layoutColumn={normalizeLayoutColumn(field.layoutColumn ?? previewColumnCount)}
                        isCompactViewport={isCompactViewport}
                        selected={field.id === selectedFieldId}
                        onSelect={setSelectedFieldId}
                        onOpenLayoutMenu={openFieldLayoutMenu}
                        onClearLayout={clearFieldLayoutPreset}
                        onRemove={removeField}
                        showDragHandle={fields.length > 1}
                      />
                    ))}
                  </div>
                ) : (
                    <div className="flex min-h-[20rem] items-center justify-center rounded-[2rem] border border-dashed border-slate-200 bg-white px-4 text-center sm:min-h-[24rem] sm:px-6 lg:min-h-[28rem]">
                      <div className="max-w-md">
                        <p className="text-lg font-semibold text-slate-900">Drop your first field here</p>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          Choose a control from the left palette to start building the form layout.
                        </p>
                      </div>
                    </div>
                  )}
                </SortableContext>
              </div>
            </div>
          </main>

          <aside className="space-y-4">
            <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-4 shadow-sm sm:p-5">
              <h2 className="text-lg font-semibold text-slate-900">Field inspector</h2>
              {selectedField ? (
                <div className="mt-4 space-y-4">
                  <FieldPreview
                    title="Label"
                    value={selectedField.label}
                    onChange={(value) =>
                      updateSelectedField((field) => ({
                        ...field,
                        label: value,
                      }))
                    }
                    inputRef={inspectorLabelRef}
                  />
                  {selectedControl?.canHavePlaceHolder ? (
                    <FieldPreview
                      title="Placeholder"
                      value={selectedField.placeholder}
                      onChange={(value) =>
                        updateSelectedField((field) => ({
                          ...field,
                          placeholder: value,
                        }))
                      }
                      placeholder="Shown inside the input"
                    />
                  ) : null}
                  <FieldPreview
                    title="Tooltip"
                    value={selectedField.tooltip}
                    onChange={(value) =>
                      updateSelectedField((field) => ({
                        ...field,
                        tooltip: value,
                      }))
                    }
                    placeholder="Optional helper text"
                  />
                  {selectedControl?.controlType.toLowerCase() === "checkbox" ? (
                    <SelectFieldPreview
                      title="Default value"
                      value={selectedField.defaultValue === "true" ? "true" : "false"}
                      onChange={(value) =>
                        updateSelectedField((field) => ({
                          ...field,
                          defaultValue: value,
                        }))
                      }
                      options={[
                        { label: "Unchecked", value: "false" },
                        { label: "Checked", value: "true" },
                      ]}
                    />
                  ) : selectedControl?.controlType.toLowerCase() === "multiselect" ? (
                    <div className="space-y-3">
                      <MultiSelectInput
                        value={getDefaultMultiSelectValues(selectedField)}
                        onChange={(nextValues) =>
                          updateSelectedField((field) => ({
                            ...field,
                            defaultValue: nextValues.join(", "),
                            options: field.options.map((option) => ({
                              ...option,
                              isDefault: nextValues.includes(option.value),
                            })),
                          }))
                        }
                        options={selectedField.options.map((option) => ({
                          label: option.displayText,
                          value: option.value,
                        }))}
                        placeholder="Choose default selections"
                      />
                      <p className="text-xs leading-5 text-slate-500">
                        Select one or more defaults from the dropdown.
                      </p>
                    </div>
                  ) : selectedControl?.controlType.toLowerCase() === "file" ? null : (
                    <FieldPreview
                      title="Default value"
                      value={selectedField.defaultValue}
                      onChange={(value) =>
                        updateSelectedField((field) => ({
                          ...field,
                          defaultValue: value,
                        }))
                      }
                    />
                  )}

                  <ToggleField
                    title="Required"
                    checked={selectedField.required}
                    onChange={(value) =>
                      updateSelectedField((field) => ({
                        ...field,
                        required: value,
                        requiredMessage:
                          value && !field.requiredMessage.trim()
                            ? `${toSentenceCase(field.label)} is required.`
                            : field.requiredMessage,
                      }))
                    }
                  />

                  {selectedControl?.canBeRequired ? (
                    <FieldPreview
                      title="Required message"
                      value={selectedField.requiredMessage}
                      onChange={(value) =>
                        updateSelectedField((field) => ({
                          ...field,
                          requiredMessage: value,
                        }))
                      }
                      placeholder="This field is required."
                    />
                  ) : null}

                  <SelectFieldPreview
                    title="Layout columns"
                    value={selectedField.layoutColumn === null ? "" : String(selectedField.layoutColumn)}
                    onChange={(value) =>
                      updateSelectedField((field) => ({
                        ...field,
                        layoutColumn: value ? Math.max(1, Math.min(4, Number(value) || 1)) : null,
                      }))
                    }
                    options={[
                      { label: "Inherit form layout", value: "" },
                      { label: "1 column", value: "1" },
                      { label: "2 columns", value: "2" },
                      { label: "3 columns", value: "3" },
                      { label: "4 columns", value: "4" },
                    ]}
                    placeholder="Choose a span"
                  />

                  {selectedControl?.controlType.toLowerCase() === "file" ? (
                    <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Accepted file types</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Leave all unchecked to allow any file.
                        </p>
                      </div>

                      <div className="grid gap-2">
                        {(selectedControl.acceptedFileTypes || []).map((item) => {
                          const isChecked = selectedField.acceptedFileTypes.includes(item.value);

                          return (
                            <label
                              key={item.value}
                              className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(event) =>
                                  updateSelectedField((field) => ({
                                    ...field,
                                    acceptedFileTypes: toggleAcceptedFileType(
                                      field.acceptedFileTypes,
                                      item.value,
                                      event.target.checked,
                                    ),
                                  }))
                                }
                                className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                              />
                              <span className="min-w-0 flex-1">{item.text}</span>
                              <span className="min-w-0 text-right text-xs font-normal text-slate-400 break-all sm:ml-auto sm:max-w-[12rem] sm:break-normal sm:truncate">
                                {item.value}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {controls.find((control) => control.id === selectedField.controlId)?.canHaveMinLength ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <FieldPreview
                        title="Min length"
                        value={selectedField.minLength}
                        onChange={(value) =>
                          updateSelectedField((field) => ({
                            ...field,
                            minLength: value,
                          }))
                        }
                        type="number"
                      />
                      <FieldPreview
                        title="Max length"
                        value={selectedField.maxLength}
                        onChange={(value) =>
                          updateSelectedField((field) => ({
                            ...field,
                            maxLength: value,
                          }))
                        }
                        type="number"
                      />
                    </div>
                  ) : null}

                  {controls.find((control) => control.id === selectedField.controlId)?.hasOptions ? (
                    <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                      <button
                        type="button"
                        onClick={addOption}
                        className="inline-flex w-full items-center justify-center rounded-full bg-cyan-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700"
                      >
                        Add option
                      </button>

                      <div className="flex flex-wrap gap-2">
                        {selectedField.options.map((option, index) => (
                          <div
                            key={option.id}
                            role="group"
                            className={[
                              "inline-flex items-center gap-2 rounded-full border bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition",
                              selectedOption?.id === option.id
                                ? "border-cyan-400 ring-2 ring-cyan-100"
                                : "border-slate-200 hover:border-cyan-300 hover:bg-cyan-50",
                            ].join(" ")}
                            title={`Option ${index + 1}: ${option.displayText}`}
                          >
                            <button
                              type="button"
                              onClick={() => selectOption(option.id)}
                              className="inline-flex items-center gap-2 rounded-full text-left"
                              aria-label={`Select option ${index + 1}`}
                              title="Click to edit"
                            >
                              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-500/10 px-1.5 text-[11px] font-semibold text-cyan-700">
                                {index + 1}
                              </span>
                              <span className="max-w-[14rem] truncate">{option.displayText}</span>
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setDefaultOption(option.id);
                              }}
                              className={[
                                "inline-flex h-6 w-6 items-center justify-center rounded-full transition",
                                option.isDefault || selectedField.defaultValue === option.value
                                  ? "bg-amber-100 text-amber-600"
                                  : "text-slate-400 hover:bg-amber-50 hover:text-amber-600",
                              ].join(" ")}
                              aria-label={
                                option.isDefault || selectedField.defaultValue === option.value
                                  ? `Default option ${index + 1}`
                                  : `Set option ${index + 1} as default`
                              }
                              title={
                                option.isDefault || selectedField.defaultValue === option.value
                                  ? "Default option"
                                  : "Set as default"
                              }
                            >
                              <svg
                                viewBox="0 0 24 24"
                                fill={option.isDefault || selectedField.defaultValue === option.value ? "currentColor" : "none"}
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              >
                                <path d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.4L12 17.9 6.2 20.8l1.1-6.4-4.7-4.6 6.5-.9Z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                removeOption(option.id);
                              }}
                              className="inline-flex h-6 w-6 items-center justify-center rounded-full text-rose-500 transition hover:bg-rose-50 hover:text-rose-700"
                              aria-label={`Remove option ${index + 1}`}
                              title="Remove option"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              >
                                <path d="M18 6 6 18" />
                                <path d="M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <FieldPreview
                            title="Display text"
                            value={selectedOption?.displayText || ""}
                            onChange={(value) => {
                              const option = selectedOption;
                              if (option) {
                                updateOption(option.id, "displayText", value);
                              }
                            }}
                          />
                          <FieldPreview
                            title="Value"
                            value={selectedOption?.value || ""}
                            onChange={(value) => {
                              const option = selectedOption;
                              if (option) {
                                updateOption(option.id, "value", value);
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="mt-4 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-500">
                  Select a field on the canvas to configure its label, tooltip, and validation
                  rules.
                </div>
              )}
            </div>

          </aside>
        </div>
      </DndContext>

      {fieldToRemove ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-900/20 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rose-50 text-rose-700">
                !
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-semibold tracking-tight text-slate-900">
                  Remove â€œ{fieldToRemove.label}â€?
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  This will permanently remove the field from the canvas. Any current
                  configuration for this field will be lost.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cancelRemoveField}
                className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRemoveField}
                className="rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                Remove field
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {optionToRemove ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-900/20 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rose-50 text-rose-700">
                !
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-semibold tracking-tight text-slate-900">
                  Remove option â€œ{optionToRemove.displayText}â€?
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  This will permanently remove the option from the selected field.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cancelRemoveOption}
                className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRemoveOption}
                className="rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                Remove option
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isPreviewOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
          <div className="flex max-h-[92vh] w-full max-w-[96rem] flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/20">
            <div className="flex flex-col gap-4 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
                  Preview
                </p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  {draft.headerText || "Untitled header"}
                </h3>
              </div>
              <button
                type="button"
                onClick={closePreview}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6">
              <div className="mx-auto w-full max-w-7xl rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                {draft.description ? (
                  <p className="mb-6 text-sm leading-6 text-slate-600">{draft.description}</p>
                ) : null}

                {fields.length > 0 ? (
                  <PreviewFormCanvas
                    fields={fields}
                    spanCount={previewColumnCount}
                    isCompactViewport={isCompactViewport}
                  />
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                    <p className="text-lg font-semibold text-slate-900">No fields to preview yet</p>
                    <p className="mt-2 text-sm text-slate-500">
                      Add controls to the canvas to see the rendered form here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {fieldLayoutMenu && fieldLayoutMenuStyle ? (
        <div
          className="fixed inset-0 z-[60]"
          onMouseDown={closeFieldLayoutMenu}
          onContextMenu={(event) => event.preventDefault()}
        >
          <div
            className="absolute w-48 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/20"
            style={fieldLayoutMenuStyle}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Layout
            </p>
            {[1, 2, 3, 4].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setFieldLayoutPreset(fieldLayoutMenu.fieldId, value)}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-800"
              >
                <span>{getLayoutPresetLabel(value)}</span>
                {fieldLayoutMenu &&
                normalizeLayoutColumn(fields.find((field) => field.id === fieldLayoutMenu.fieldId)?.layoutColumn ?? previewColumnCount) === value ? (
                  <span className="text-cyan-700">âœ“</span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {isClearConfirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-900/20 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rose-50 text-rose-700">
                !
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-semibold tracking-tight text-slate-900">
                  Clear all canvas fields?
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  This will remove every field from the canvas. Your inspector settings will be
                  cleared for the current selection, and this action cannot be undone.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsClearConfirmOpen(false)}
                className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={clearAllCanvasFields}
                className="rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                Clear canvas
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

