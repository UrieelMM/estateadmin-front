import { useMemo, useRef, useState } from "react";
import { Combobox } from "@headlessui/react";
import { UserIcon } from "@heroicons/react/24/outline";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { UserData } from "../../../../interfaces/UserData";

export type RecipientSortOrder = "" | "asc" | "desc";

const cn = ( ...classes: ( string | boolean | undefined | null )[] ) =>
  classes.filter( Boolean ).join( " " );

const inputBase =
  "block w-full rounded-lg border-0 bg-white py-2 pr-3 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 transition focus:ring-2 focus:ring-inset focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-700 dark:placeholder:text-gray-500 dark:focus:ring-indigo-400 dark:disabled:bg-gray-800/50 dark:disabled:text-gray-500";

const defaultGetUserId = ( user: UserData ) => user.uid;

const normalizeSearchText = ( value: string ) =>
  String( value || "" )
    .normalize( "NFD" )
    .replace( /[\u0300-\u036f]/g, "" )
    .toLowerCase()
    .trim();
const compactSearchText = ( value: string ) =>
  normalizeSearchText( value ).replace( /[^a-z0-9]/g, "" );
const normalizeTowerValue = ( value: string ) => {
  const normalized = normalizeSearchText( value );
  return normalized.replace( /^torre\s*/g, "" ).trim();
};

interface RecipientComboboxProps {
  users: UserData[];
  value: string;
  onChange: ( userId: string ) => void;
  sortOrder: RecipientSortOrder;
  onSortOrderChange: ( value: RecipientSortOrder ) => void;
  disabled?: boolean;
  getUserId?: ( user: UserData ) => string;
  /** Si regresa texto, la opción se muestra deshabilitada con ese texto. */
  getDisabledReason?: ( user: UserData ) => string | null;
}

const RecipientCombobox = ( {
  users,
  value,
  onChange,
  sortOrder,
  onSortOrderChange,
  disabled = false,
  getUserId = defaultGetUserId,
  getDisabledReason,
}: RecipientComboboxProps ) => {
  const [ search, setSearch ] = useState<string>( "" );
  const inputRef = useRef<HTMLInputElement | null>( null );
  const buttonRef = useRef<HTMLButtonElement | null>( null );

  const filteredUsers = useMemo( () => {
    const term = normalizeSearchText( search );
    const compactTerm = compactSearchText( search );
    const towerTerm = normalizeTowerValue( search );
    const compactTowerTerm = compactSearchText( towerTerm );
    const isTowerQuery = term.startsWith( "torre" ) && towerTerm.length > 0;

    const usersFiltered = !term
      ? users
      : users.filter( ( user ) => {
        const number = normalizeSearchText( user.number || "" );
        const compactNumber = compactSearchText( user.number || "" );
        const name = normalizeSearchText( user.name || "" );
        const lastName = normalizeSearchText( user.lastName || "" );
        const fullName = `${ name } ${ lastName }`.trim();
        const compactName = compactSearchText( user.name || "" );
        const compactLastName = compactSearchText( user.lastName || "" );
        const compactFullName = `${ compactName }${ compactLastName }`;
        const rawTower = String( user.tower || "" );
        const tower = normalizeSearchText( rawTower );
        const normalizedTower = normalizeTowerValue( rawTower );
        const compactTower = compactSearchText( rawTower );
        const compactNormalizedTower = compactSearchText( normalizedTower );
        const towerMatches = isTowerQuery
          ? normalizedTower === towerTerm ||
            compactNormalizedTower === compactTowerTerm
          : tower.includes( term ) ||
            normalizedTower.includes( towerTerm ) ||
            compactTower.includes( compactTerm ) ||
            compactNormalizedTower.includes( compactTowerTerm );
        return (
          number.includes( term ) ||
          compactNumber.includes( compactTerm ) ||
          name.includes( term ) ||
          fullName.includes( term ) ||
          compactName.includes( compactTerm ) ||
          compactFullName.includes( compactTerm ) ||
          towerMatches
        );
      } );

    if ( sortOrder === "" ) return usersFiltered;

    return [ ...usersFiltered ].sort( ( a, b ) => {
      const numberA = String( a.number || "" );
      const numberB = String( b.number || "" );
      const comparison = numberA.localeCompare( numberB, "es", {
        numeric: true,
        sensitivity: "base",
      } );
      return sortOrder === "asc" ? comparison : -comparison;
    } );
  }, [ users, search, sortOrder ] );

  const getLabel = ( userId: string ) => {
    const user = users.find( ( u ) => getUserId( u ) === userId );
    if ( !user ) return "";
    const towerValue = String( user.tower || "" ).trim();
    const normalizedTowerLabel = towerValue
      ? towerValue.replace( /^torre\s*/i, "" ).trim()
      : "";
    const towerLabel = normalizedTowerLabel
      ? ` · Torre ${ normalizedTowerLabel }`
      : "";
    return `${ user.number || "-" } ${ user.name || "" }${ towerLabel }`.trim();
  };

  const handleSortOrderChange = ( nextValue: RecipientSortOrder ) => {
    onSortOrderChange( nextValue );
    if ( disabled ) return;
    requestAnimationFrame( () => {
      inputRef.current?.focus();
    } );
  };

  return (
    <div>
      <div className="flex items-end justify-between gap-2">
        <label
          htmlFor="nameRecipient"
          className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400"
        >
          Buscar condómino
        </label>
        <div className="flex items-center gap-1.5">
          <label
            htmlFor="recipientSortOrder"
            className="text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
          >
            Orden
          </label>
          <select
            id="recipientSortOrder"
            value={ sortOrder }
            onChange={ ( e ) =>
              handleSortOrderChange( e.target.value as RecipientSortOrder )
            }
            disabled={ disabled }
            className="rounded-md border border-gray-200 bg-white px-2 py-0.5 text-[11px] text-gray-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:disabled:bg-gray-700"
          >
            <option value="">Sin orden</option>
            <option value="asc">Asc</option>
            <option value="desc">Desc</option>
          </select>
        </div>
      </div>
      <div className="mt-1.5">
        <Combobox
          value={ value }
          onChange={ ( userId: string ) => {
            if ( userId ) setSearch( "" );
            onChange( userId );
          } }
          disabled={ disabled }
        >
          <div className="relative">
            <UserIcon className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Combobox.Input
              ref={ inputRef }
              id="nameRecipient"
              name="nameRecipient"
              className={ `${ inputBase } pl-9 pr-10` }
              displayValue={ ( userId: string ) => getLabel( userId ) }
              onChange={ ( event ) => setSearch( event.target.value ) }
              onFocus={ () => buttonRef.current?.click() }
              placeholder="Buscar por nombre, número o torre"
            />
            <Combobox.Button
              ref={ buttonRef }
              className="absolute inset-y-0 right-0 flex items-center pr-2"
            >
              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
            </Combobox.Button>
          </div>

          <Combobox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none dark:bg-gray-800 dark:ring-white/[0.08]">
            <Combobox.Option
              value=""
              className={ ( { active } ) =>
                `relative cursor-default select-none px-3 py-1.5 text-[11px] italic ${ active
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                  : "text-gray-500 dark:text-gray-400"
                }`
              }
            >
              Sin selección
            </Combobox.Option>

            { filteredUsers.length === 0 ? (
              <div className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400">
                Sin resultados
              </div>
            ) : (
              filteredUsers.map( ( user ) => {
                const userId = getUserId( user );
                const disabledReason = getDisabledReason?.( user ) || null;
                return (
                  <Combobox.Option
                    key={ userId }
                    value={ userId }
                    disabled={ !!disabledReason }
                    className={ ( { active } ) =>
                      cn(
                        "relative cursor-default select-none px-2 py-1.5",
                        active && "bg-indigo-50 dark:bg-indigo-500/10",
                        !!disabledReason && "opacity-60"
                      )
                    }
                  >
                    { ( { active } ) => (
                      <div className="flex items-start gap-2.5">
                        <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-100 text-[10px] font-bold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
                          { String( user.number || "?" ).slice( 0, 3 ) }
                        </span>
                        <div className="min-w-0 flex-1">
                          <p
                            className={ cn(
                              "truncate text-sm font-semibold",
                              value === userId
                                ? "text-indigo-700 dark:text-indigo-300"
                                : "text-gray-900 dark:text-gray-100"
                            ) }
                          >
                            { user.name } { user.lastName || "" }
                          </p>
                          { String( user.tower || "" ).trim().length > 0 && <p
                            className={ cn(
                              "text-[11px]",
                              active
                                ? "text-indigo-700/80 dark:text-indigo-200/70"
                                : "text-gray-500 dark:text-gray-400"
                            ) }
                          >
                            { `Torre ${ String( user.tower || "" )
                                .replace( /^torre\s*/i, "" )
                                .trim() }` }
                          </p> }
                          { disabledReason && (
                            <p className="text-[11px] font-medium text-amber-700 dark:text-amber-300">
                              { disabledReason }
                            </p>
                          ) }
                        </div>
                        { value === userId && (
                          <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-300" />
                        ) }
                      </div>
                    ) }
                  </Combobox.Option>
                );
              } )
            ) }
          </Combobox.Options>
        </Combobox>
      </div>
      <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
        Puedes buscar por nombre, número de unidad o torre.
      </p>
    </div>
  );
};

export default RecipientCombobox;
