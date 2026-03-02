namespace RequestsForCarRepairs.API.DTOs;

public class UserDto
{
    public int UserID { get; set; }
    public string Fio { get; set; } = "";
    public string Phone { get; set; } = "";
    public string Login { get; set; } = "";
    public string Type { get; set; } = "";
}