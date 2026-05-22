export const LOCATIONS: Record<string, { nombre: string; flag: string; regions: string[] }> = {
  MX: {
    nombre: "México",
    flag: "MX",
    regions: [
      "Ciudad de México", "Guadalajara", "Monterrey", "Puebla", "Tijuana",
      "León", "Ciudad Juárez", "Zapopan", "Mérida", "San Luis Potosí",
      "Aguascalientes", "Mexicali", "Hermosillo", "Saltillo", "Morelia",
      "Querétaro", "Culiacán", "Cancún", "Acapulco", "Torreón",
      "Toluca", "Chihuahua", "Naucalpan", "Veracruz", "Ecatepec",
      "Durango", "Tuxtla Gutiérrez", "Tepic", "Villahermosa", "Xalapa",
      "Oaxaca de Juárez", "Colima", "Pachuca", "Campeche", "La Paz",
      "Los Cabos", "Mazatlán", "Playa del Carmen", "Irapuato", "Celaya",
      "Nuevo Laredo", "Matamoros", "Reynosa", "Cuernavaca", "Tampico",
    ],
  },
  AR: {
    nombre: "Argentina",
    flag: "AR",
    regions: [
      "Buenos Aires", "CABA", "Catamarca", "Chaco", "Chubut",
      "Córdoba", "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa",
      "La Rioja", "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta",
      "San Juan", "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero",
      "Tierra del Fuego", "Tucumán",
    ],
  },
  ES: {
    nombre: "España",
    flag: "ES",
    regions: [
      "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila",
      "Badajoz", "Barcelona", "Burgos", "Cáceres", "Cádiz", "Cantabria",
      "Castellón", "Ciudad Real", "Córdoba", "Cuenca", "Gerona", "Granada",
      "Guadalajara", "Guipúzcoa", "Huelva", "Huesca", "Islas Baleares",
      "Las Palmas", "León", "Lérida", "Lugo", "Madrid", "Málaga",
      "Murcia", "Navarra", "Orense", "Palencia", "Pontevedra", "La Rioja",
      "Salamanca", "Santa Cruz de Tenerife", "Segovia", "Sevilla", "Soria",
      "Tarragona", "Teruel", "Toledo", "Valencia", "Valladolid", "Vizcaya",
      "Zamora", "Zaragoza",
    ],
  },
  US: {
    nombre: "Estados Unidos",
    flag: "US",
    regions: [
      "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
      "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
      "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
      "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
      "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
      "New Hampshire", "New Jersey", "New Mexico", "New York",
      "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
      "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
      "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
      "West Virginia", "Wisconsin", "Wyoming",
    ],
  },
}

export const COUNTRY_LIST = [
  { code: "AR", nombre: "Argentina" },
  { code: "MX", nombre: "México" },
  { code: "US", nombre: "Estados Unidos" },
  { code: "ES", nombre: "España" },
]

export function getRegions(countryCode: string): string[] {
  return LOCATIONS[countryCode]?.regions ?? []
}

export function getRegionLabel(countryCode: string): string {
  if (countryCode === "MX") return "Ciudad"
  if (countryCode === "AR") return "Provincia"
  if (countryCode === "US") return "Estado"
  return "Ciudad/Región"
}
