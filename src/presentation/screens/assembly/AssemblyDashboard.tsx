import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusIcon,
  TrashIcon,
  PresentationChartBarIcon,
  ArrowTopRightOnSquareIcon,
  PencilSquareIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import { SparklesIcon } from "@heroicons/react/24/solid";
import toast from "react-hot-toast";
import { useAssemblyStore } from "../../../store/useAssemblyStore";
import {
  SlideType,
  SlideConfigDraft,
  SLIDE_TYPE_META,
  AssemblyPresentation,
  AssemblyPeriod,
} from "../../../interfaces/assembly";
import { AssemblyLogoUpload } from "./AssemblyLogoUpload";
import { AssemblySlideEditor, createSlideDraft } from "./AssemblySlideEditor";

// ── Slide types disponibles en el builder ─────────────────────────────────────
const SLIDE_TYPES: SlideType[] = [
  "cover",
  "executive_summary",
  "agenda",
  "financial",
  "financial_breakdown",
  "collections",
  "collections_top",
  "maintenance",
  "projects",
  "comparison",
  "agreements",
  "custom_text",
];

// Slides con editor interno
const EDITABLE_TYPES: SlideType[] = [
  "cover",
  "custom_text",
  "projects",
  "agenda",
  "agreements",
  "collections_top",
  "comparison",
];

function SlideTypePill( { type, onAdd }: { type: SlideType; onAdd: () => void; } ) {
  const meta = SLIDE_TYPE_META[ type ];
  return (
    <button
      onClick={ onAdd }
      className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-white/[0.03] hover:border-indigo-400 dark:hover:border-indigo-500/40 hover:bg-indigo-50 dark:hover:bg-indigo-500/5 transition-all text-left group"
    >
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-gray-900 dark:text-white">{ meta.label }</p>
        <p className="text-[10px] text-gray-500 dark:text-slate-500 leading-tight line-clamp-2">{ meta.description }</p>
      </div>
      <PlusIcon className="w-4 h-4 text-indigo-400/50 group-hover:text-indigo-500 shrink-0 transition-colors" />
    </button>
  );
}

// ── Presentation card ─────────────────────────────────────────────────────────
function PresentationCard( {
  p,
  onEdit,
  onDelete,
  index = 0,
}: {
  p: AssemblyPresentation;
  onEdit: () => void;
  onDelete: () => void;
  index?: number;
} ) {
  const viewerUrl = `/asamblea/${ p.id }`;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-white/[0.03] p-5 hover:border-indigo-300 dark:hover:border-indigo-500/30 transition-all group shadow-sm flex flex-col gap-3">
      {/* Halo gradient en hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={ { background: "radial-gradient(600px circle at var(--mx,50%) var(--my,50%), rgba(99,102,241,0.08), transparent 40%)" } } />
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-indigo-500/10 blur-3xl opacity-0 group-hover:opacity-70 transition-opacity duration-500 pointer-events-none" />

      <div className="flex items-start justify-between gap-3 relative">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <PresentationChartBarIcon className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">{ p.title }</h3>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-slate-500">
            { new Date( p.assemblyDate ).toLocaleDateString( "es-MX", { year: "numeric", month: "long", day: "numeric" } ) }
          </p>
          { p.period && (
            <p className="text-[10px] text-gray-400 dark:text-slate-600 mt-0.5">
              Datos: { p.period.start } → { p.period.end }
            </p>
          ) }
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          { p.logoUrl && (
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-white border border-gray-200 dark:border-white/[0.08]">
              <img src={ p.logoUrl } alt="logo" className="w-full h-full object-contain" />
            </div>
          ) }
          <span
            className={ `text-[10px] font-semibold px-2 py-0.5 rounded-full border ${ p.status === "published"
                ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30"
                : "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30"
              }` }
          >
            { p.status === "published" ? "Publicada" : "Borrador" }
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap relative">
        { ( p.draftSlides ?? [] ).slice( 0, 6 ).map( ( s, i ) => {
          const meta = SLIDE_TYPE_META[ s.type ];
          return (
            <motion.span
              key={ i }
              initial={ { opacity: 0, y: 4 } }
              animate={ { opacity: 1, y: 0 } }
              transition={ { duration: 0.3, delay: index * 0.04 + i * 0.04 } }
              whileHover={ { scale: 1.08, y: -1 } }
              className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/[0.04] text-gray-500 dark:text-slate-500 border border-gray-200 dark:border-white/[0.06] cursor-default"
            >
              { meta?.label ?? s.type }
            </motion.span>
          );
        } ) }
        { ( p.draftSlides ?? [] ).length > 6 && (
          <span className="text-[9px] text-gray-400 dark:text-slate-600">
            +{ ( p.draftSlides ?? [] ).length - 6 } más
          </span>
        ) }
      </div>

      <div className="flex items-center gap-2 mt-auto">
        <button
          onClick={ onEdit }
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-white/[0.07] bg-gray-50 dark:bg-white/[0.03] text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:border-indigo-300 dark:hover:border-indigo-500/40 text-xs font-medium transition-all"
        >
          <PencilSquareIcon className="w-3.5 h-3.5" />
          Editar
        </button>
        { p.status === "published" && (
          <motion.a
            href={ viewerUrl }
            target="_blank"
            rel="noopener noreferrer"
            whileHover={ { scale: 1.03 } }
            whileTap={ { scale: 0.97 } }
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-indigo-300 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-xs font-semibold transition-all"
          >
            <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
            Presentar
          </motion.a>
        ) }
        <button
          onClick={ onDelete }
          className="p-2 rounded-lg border border-gray-200 dark:border-white/[0.07] bg-gray-50 dark:bg-white/[0.03] text-gray-400 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-500/30 transition-all"
        >
          <TrashIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Builder modal ─────────────────────────────────────────────────────────────

interface BuilderState {
  title: string;
  assemblyDate: string;
  period: AssemblyPeriod;
  logoUrl?: string;
  draftSlides: SlideConfigDraft[];
}

function getDefaultState( initial?: AssemblyPresentation | null ): BuilderState {
  const today = new Date().toISOString().slice( 0, 10 );
  const monthStart = today.slice( 0, 8 ) + "01";
  return {
    title: initial?.title ?? "Asamblea Ordinaria",
    assemblyDate: initial?.assemblyDate ? initial.assemblyDate.slice( 0, 10 ) : today,
    period: initial?.period ?? { start: monthStart, end: today },
    logoUrl: initial?.logoUrl,
    draftSlides: initial?.draftSlides ?? [
      createSlideDraft( "cover" ),
      createSlideDraft( "executive_summary" ),
    ],
  };
}

function BuilderModal( {
  initial,
  onClose,
  onSave,
  onPublish,
  saving,
}: {
  initial?: AssemblyPresentation | null;
  onClose: () => void;
  onSave: (
    id: string | undefined,
    state: BuilderState
  ) => Promise<void>;
  onPublish: (
    id: string | undefined,
    state: BuilderState
  ) => Promise<void>;
  saving: boolean;
} ) {
  const [ state, setState ] = useState<BuilderState>( () => getDefaultState( initial ) );
  const [ editingSlide, setEditingSlide ] = useState<string | null>( null );
  const isEditingPublished = initial?.status === "published";

  const update = ( patch: Partial<BuilderState> ) => setState( ( s ) => ( { ...s, ...patch } ) );

  const addSlide = ( type: SlideType ) => {
    const newDraft = createSlideDraft( type );
    setState( ( s ) => ( { ...s, draftSlides: [ ...s.draftSlides, newDraft ] } ) );
    if ( EDITABLE_TYPES.includes( type ) ) {
      setEditingSlide( newDraft.localId );
    }
  };

  const removeSlide = ( localId: string ) => {
    setState( ( s ) => ( { ...s, draftSlides: s.draftSlides.filter( ( d ) => d.localId !== localId ) } ) );
  };

  const moveSlide = ( localId: string, dir: -1 | 1 ) => {
    setState( ( s ) => {
      const idx = s.draftSlides.findIndex( ( d ) => d.localId === localId );
      if ( idx < 0 ) return s;
      const next = s.draftSlides.slice();
      const swap = idx + dir;
      if ( swap < 0 || swap >= next.length ) return s;
      [ next[ idx ], next[ swap ] ] = [ next[ swap ], next[ idx ] ];
      return { ...s, draftSlides: next };
    } );
  };

  const updateSlideDraft = ( localId: string, patch: Partial<SlideConfigDraft> ) => {
    setState( ( s ) => ( {
      ...s,
      draftSlides: s.draftSlides.map( ( d ) => ( d.localId === localId ? { ...d, ...patch } : d ) ),
    } ) );
  };

  const validPeriod = useMemo( () => {
    return new Date( state.period.start ).getTime() <= new Date( state.period.end ).getTime();
  }, [ state.period ] );

  const handlePeriodPreset = ( months: number ) => {
    const end = new Date();
    const start = new Date( end );
    start.setMonth( start.getMonth() - months + 1 );
    start.setDate( 1 );
    update( {
      period: {
        start: start.toISOString().slice( 0, 10 ),
        end: end.toISOString().slice( 0, 10 ),
      },
    } );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={ { opacity: 0, scale: 0.96, y: 20 } }
        animate={ { opacity: 1, scale: 1, y: 0 } }
        exit={ { opacity: 0, scale: 0.96, y: 20 } }
        className="w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-2xl border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-[#0a0a1a] flex flex-col shadow-2xl"
      >
        {/* Header */ }
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-white/[0.07]">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            { initial ? "Editar presentación" : "Nueva presentación" }
          </h2>
          <button
            onClick={ onClose }
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-white transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left — config + slide list */ }
          <div className="lg:col-span-3 flex flex-col gap-5">
            {/* Basic info */ }
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5">
                  Título
                </label>
                <input
                  value={ state.title }
                  onChange={ ( e ) => update( { title: e.target.value } ) }
                  className="w-full bg-gray-50 dark:bg-white/[0.04] border border-gray-300 dark:border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white"
                  placeholder="Asamblea Ordinaria Junio 2025"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5">
                    Fecha asamblea
                  </label>
                  <input
                    type="date"
                    value={ state.assemblyDate }
                    onChange={ ( e ) => update( { assemblyDate: e.target.value } ) }
                    className="w-full bg-gray-50 dark:bg-white/[0.04] border border-gray-300 dark:border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    <CalendarDaysIcon className="w-3 h-3" /> Periodo desde
                  </label>
                  <input
                    type="date"
                    value={ state.period.start }
                    onChange={ ( e ) => update( { period: { ...state.period, start: e.target.value } } ) }
                    className="w-full bg-gray-50 dark:bg-white/[0.04] border border-gray-300 dark:border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    <CalendarDaysIcon className="w-3 h-3" /> Periodo hasta
                  </label>
                  <input
                    type="date"
                    value={ state.period.end }
                    onChange={ ( e ) => update( { period: { ...state.period, end: e.target.value } } ) }
                    className="w-full bg-gray-50 dark:bg-white/[0.04] border border-gray-300 dark:border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>
              </div>

              { !validPeriod && (
                <p className="text-[11px] text-rose-500 dark:text-rose-400">
                  La fecha "desde" debe ser anterior o igual a "hasta".
                </p>
              ) }

              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] text-gray-500 dark:text-slate-500 uppercase tracking-widest font-semibold mr-1 mt-1.5">Atajos:</span>
                <PresetChip label="Mes en curso" onClick={ () => handlePeriodPreset( 1 ) } />
                <PresetChip label="Trimestre" onClick={ () => handlePeriodPreset( 3 ) } />
                <PresetChip label="Semestre" onClick={ () => handlePeriodPreset( 6 ) } />
                <PresetChip label="Año en curso" onClick={ () => {
                  const today = new Date();
                  update( {
                    period: {
                      start: `${ today.getFullYear() }-01-01`,
                      end: today.toISOString().slice( 0, 10 ),
                    },
                  } );
                } } />
              </div>

              <AssemblyLogoUpload value={ state.logoUrl } onChange={ ( v ) => update( { logoUrl: v } ) } />
            </div>

            {/* Slide order */ }
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                Slides ({ state.draftSlides.length })
              </p>
              <div className="space-y-2">
                { state.draftSlides.length === 0 && (
                  <p className="text-xs text-gray-400 dark:text-slate-600 py-4 text-center border border-dashed border-gray-300 dark:border-white/[0.07] rounded-xl">
                    Agrega slides desde el panel derecho
                  </p>
                ) }
                { state.draftSlides.map( ( s, idx ) => {
                  const meta = SLIDE_TYPE_META[ s.type ];
                  const isEditing = editingSlide === s.localId;
                  const editable = EDITABLE_TYPES.includes( s.type );
                  return (
                    <div
                      key={ s.localId }
                      className="rounded-xl border border-gray-200 dark:border-white/[0.07] bg-gray-50 dark:bg-white/[0.02] overflow-hidden"
                    >
                      <div className="flex items-center gap-2 px-3 py-2.5">
                        <span className="text-[10px] text-gray-400 dark:text-slate-600 w-5 text-center font-mono">
                          { idx + 1 }
                        </span>
                        <span className="text-xs font-semibold text-gray-900 dark:text-white flex-1 truncate">
                          { meta.label }
                        </span>
                        { editable && (
                          <button
                            onClick={ () => setEditingSlide( isEditing ? null : s.localId ) }
                            className={ `text-[10px] px-2 py-0.5 rounded border transition-colors ${ isEditing
                                ? "border-indigo-300 dark:border-indigo-500/40 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10"
                                : "border-gray-200 dark:border-white/[0.07] text-gray-500 dark:text-slate-500 hover:text-gray-800 dark:hover:text-white"
                              }` }
                          >
                            { isEditing ? "Listo" : "Configurar" }
                          </button>
                        ) }
                        <div className="flex gap-1">
                          <button
                            onClick={ () => moveSlide( s.localId, -1 ) }
                            disabled={ idx === 0 }
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-white/[0.06] text-gray-400 dark:text-slate-600 hover:text-gray-800 dark:hover:text-white disabled:opacity-20 transition-colors text-xs"
                          >
                            ↑
                          </button>
                          <button
                            onClick={ () => moveSlide( s.localId, 1 ) }
                            disabled={ idx === state.draftSlides.length - 1 }
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-white/[0.06] text-gray-400 dark:text-slate-600 hover:text-gray-800 dark:hover:text-white disabled:opacity-20 transition-colors text-xs"
                          >
                            ↓
                          </button>
                          <button
                            onClick={ () => removeSlide( s.localId ) }
                            className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-500/10 text-gray-400 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                          >
                            <XMarkIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      { isEditing && (
                        <AssemblySlideEditor
                          draft={ s }
                          onChange={ ( patch ) => updateSlideDraft( s.localId, patch ) }
                        />
                      ) }
                    </div>
                  );
                } ) }
              </div>
            </div>
          </div>

          {/* Right: slide type picker */ }
          <div className="lg:col-span-2 flex flex-col gap-3">
            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-widest">
              Agregar slide
            </p>
            <div className="flex flex-col gap-2 max-h-[440px] overflow-y-auto pr-1">
              { SLIDE_TYPES.map( ( type ) => (
                <SlideTypePill key={ type } type={ type } onAdd={ () => addSlide( type ) } />
              ) ) }
            </div>
            <div className="mt-2 rounded-xl border border-amber-300 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5 p-3">
              <div className="flex items-start gap-2">
                <ExclamationTriangleIcon className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-700 dark:text-amber-300/70 leading-relaxed">
                  Los datos financieros, de cobros, mantenimiento y proyectos se filtran por el rango
                  seleccionado. Al { isEditingPublished ? <strong>actualizar</strong> : <strong>publicar</strong> } se consultan de nuevo y se reemplaza el snapshot público.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */ }
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-white/[0.07] bg-gray-50 dark:bg-transparent">
          <button
            onClick={ onClose }
            className="px-4 py-2 rounded-xl text-sm text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={ () => onSave( initial?.id, state ) }
            disabled={ saving || !state.title || state.draftSlides.length === 0 || !validPeriod }
            className="px-4 py-2 rounded-xl border border-gray-300 dark:border-white/[0.1] bg-white dark:bg-white/[0.05] text-sm text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            { isEditingPublished ? "Actualizar publicación" : "Guardar borrador" }
          </button>
          <button
            onClick={ () => onPublish( initial?.id, state ) }
            disabled={ saving || !state.title || state.draftSlides.length === 0 || !validPeriod }
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            { saving ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                { isEditingPublished ? "Actualizando…" : "Publicando…" }
              </>
            ) : (
              <>
                <SparklesIcon className="w-4 h-4" />
                { isEditingPublished ? "Actualizar datos" : "Publicar" }
              </>
            ) }
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function PresetChip( { label, onClick }: { label: string; onClick: () => void; } ) {
  return (
    <button
      type="button"
      onClick={ onClick }
      className="text-[10px] px-2 py-1 rounded-full border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-white/[0.03] text-gray-600 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors font-medium"
    >
      { label }
    </button>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
const AssemblyDashboard = () => {
  const {
    presentations,
    loading,
    fetchPresentations,
    createDraft,
    updateDraft,
    publishPresentation,
    deletePresentation,
  } = useAssemblyStore();

  const [ showModal, setShowModal ] = useState( false );
  const [ editingPresentation, setEditingPresentation ] = useState<AssemblyPresentation | null>( null );
  const [ saving, setSaving ] = useState( false );
  const [ successId, setSuccessId ] = useState<string | null>( null );

  useEffect( () => {
    fetchPresentations();
  }, [ fetchPresentations ] );

  const handleOpenNew = () => { setEditingPresentation( null ); setShowModal( true ); };
  const handleEdit = ( p: AssemblyPresentation ) => { setEditingPresentation( p ); setShowModal( true ); };
  const handleClose = () => { setShowModal( false ); setEditingPresentation( null ); };

  const handleSave = async ( id: string | undefined, st: BuilderState ) => {
    setSaving( true );
    try {
      if ( id ) {
        if ( editingPresentation?.status === "published" ) {
          await publishPresentation( id, st.title, st.assemblyDate, st.draftSlides, { period: st.period, logoUrl: st.logoUrl } );
          setSuccessId( id );
          toast.success( "Presentación actualizada con datos frescos" );
          setTimeout( () => setSuccessId( null ), 4500 );
        } else {
          await updateDraft( id, st.title, st.assemblyDate, st.draftSlides, { period: st.period, logoUrl: st.logoUrl } );
          toast.success( "Borrador guardado" );
        }
      } else {
        await createDraft( st.title, st.assemblyDate, st.draftSlides, { period: st.period, logoUrl: st.logoUrl } );
        toast.success( "Borrador creado" );
      }
      handleClose();
    } catch ( e: any ) {
      toast.error( e?.message || "Error al guardar" );
    } finally {
      setSaving( false );
    }
  };

  const handlePublish = async ( id: string | undefined, st: BuilderState ) => {
    setSaving( true );
    try {
      let presentationId = id;
      if ( !presentationId ) {
        presentationId = await createDraft( st.title, st.assemblyDate, st.draftSlides, { period: st.period, logoUrl: st.logoUrl } );
      }
      await publishPresentation( presentationId, st.title, st.assemblyDate, st.draftSlides, { period: st.period, logoUrl: st.logoUrl } );
      setSuccessId( presentationId );
      handleClose();
      toast.success( id ? "Presentación actualizada con datos frescos" : "Presentación publicada" );
      setTimeout( () => setSuccessId( null ), 4500 );
    } catch ( e: any ) {
      toast.error( e?.message || "Error al publicar" );
    } finally {
      setSaving( false );
    }
  };

  const handleDelete = async ( id: string ) => {
    if ( !window.confirm( "¿Eliminar esta presentación? Esta acción no se puede deshacer." ) ) return;
    await deletePresentation( id );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */ }
      <motion.div
        initial={ { opacity: 0, y: -16 } }
        animate={ { opacity: 1, y: 0 } }
        transition={ { duration: 0.55, ease: [ 0.22, 1, 0.36, 1 ] } }
        className="flex items-start justify-between mb-8 gap-4 flex-wrap"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <motion.span
              animate={ { rotate: [ 0, 8, -8, 0 ], scale: [ 1, 1.08, 1 ] } }
              transition={ { duration: 2.5, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" } }
            >
              <PresentationChartBarIcon className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
            </motion.span>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">
              Presentaciones de Asamblea
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-slate-500 max-w-2xl">
            Crea presentaciones dinámicas con datos reales del condominio. Selecciona un rango de
            fechas y los slides traerán automáticamente los datos correspondientes.
          </p>
        </div>
        <motion.button
          onClick={ handleOpenNew }
          whileHover={ { scale: 1.04, y: -1 } }
          whileTap={ { scale: 0.97 } }
          transition={ { duration: 0.2 } }
          className="relative flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold transition-colors shrink-0 shadow-lg shadow-indigo-500/25 overflow-hidden"
        >
          <motion.span
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={ { x: [ "-100%", "200%" ] } }
            transition={ { duration: 2.4, repeat: Infinity, ease: "linear", repeatDelay: 1.5 } }
          />
          <PlusIcon className="w-4 h-4 relative" />
          <span className="relative">Nueva presentación</span>
        </motion.button>
      </motion.div>

      {/* Success banner */ }
      <AnimatePresence>
        { successId && (
          <motion.div
            initial={ { opacity: 0, y: -16, scale: 0.97 } }
            animate={ { opacity: 1, y: 0, scale: 1 } }
            exit={ { opacity: 0, y: -10, scale: 0.97 } }
            transition={ { duration: 0.4, ease: [ 0.22, 1, 0.36, 1 ] } }
            className="relative overflow-hidden mb-6 flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-300/20 to-transparent"
              animate={ { x: [ "-100%", "200%" ] } }
              transition={ { duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1 } }
            />
            <div className="flex items-center gap-2 relative">
              <motion.span
                animate={ { scale: [ 1, 1.2, 1 ], rotate: [ 0, 8, -8, 0 ] } }
                transition={ { duration: 1.4, repeat: 3, ease: "easeInOut" } }
              >
                <CheckCircleIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </motion.span>
              <span className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                ¡Presentación publicada con éxito!
              </span>
            </div>
            <a
              href={ `/asamblea/${ successId }` }
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-200 dark:hover:bg-emerald-500/30 transition-colors"
            >
              <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
              Abrir presentación
            </a>
          </motion.div>
        ) }
      </AnimatePresence>

      {/* Content */ }
      { loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-300 dark:border-indigo-500/30 border-t-indigo-500 animate-spin" />
        </div>
      ) : presentations.length === 0 ? (
        <motion.div
          initial={ { opacity: 0, y: 20 } }
          animate={ { opacity: 1, y: 0 } }
          transition={ { duration: 0.55, ease: [ 0.22, 1, 0.36, 1 ] } }
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <motion.div
            animate={ { y: [ 0, -8, 0 ] } }
            transition={ { duration: 3, repeat: Infinity, ease: "easeInOut" } }
            className="p-5 rounded-2xl border border-gray-200 dark:border-white/[0.07] bg-gray-50 dark:bg-white/[0.02] mb-4"
          >
            <PresentationChartBarIcon className="w-10 h-10 text-gray-400 dark:text-slate-600" />
          </motion.div>
          <p className="text-gray-600 dark:text-slate-400 font-medium mb-1">Sin presentaciones aún</p>
          <p className="text-sm text-gray-400 dark:text-slate-600 mb-4">
            Crea tu primera presentación de asamblea con datos en vivo.
          </p>
          <motion.button
            onClick={ handleOpenNew }
            whileHover={ { scale: 1.04, y: -1 } }
            whileTap={ { scale: 0.97 } }
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-indigo-300 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-sm font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Crear primera presentación
          </motion.button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            { presentations.map( ( p, idx ) => (
              <motion.div
                key={ p.id }
                layout
                initial={ { opacity: 0, y: 24, scale: 0.96 } }
                animate={ {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { duration: 0.5, delay: idx * 0.06, ease: [ 0.22, 1, 0.36, 1 ] },
                } }
                exit={ { opacity: 0, scale: 0.94, y: -10, transition: { duration: 0.25 } } }
                whileHover={ { y: -3, transition: { duration: 0.2 } } }
              >
                <PresentationCard
                  p={ p }
                  index={ idx }
                  onEdit={ () => handleEdit( p ) }
                  onDelete={ () => p.id && handleDelete( p.id ) }
                />
              </motion.div>
            ) ) }
          </AnimatePresence>
        </div>
      ) }

      {/* Builder modal */ }
      <AnimatePresence>
        { showModal && (
          <BuilderModal
            initial={ editingPresentation }
            onClose={ handleClose }
            onSave={ handleSave }
            onPublish={ handlePublish }
            saving={ saving }
          />
        ) }
      </AnimatePresence>
    </div>
  );
};

export default AssemblyDashboard;
