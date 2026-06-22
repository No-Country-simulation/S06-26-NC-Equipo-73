export type Servicio = {
  name: string
  isActive: boolean
  setServicios?: React.Dispatch<React.SetStateAction<Servicio[]>>
}