
namespace RequestsForCarRepairs.API.Models
{
    public class LoginRequest
    {
        public string Login { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class AddCommentRequest
    {
        public int MasterID { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class UpdateStatusRequest
    {
        public string Status { get; set; } = string.Empty;
    }

    public class AssignMasterRequest
    {
        public int MasterID { get; set; }
    }

    public class UpdatePartsRequest
    {
        public string Parts { get; set; } = string.Empty;
    }

    public class ExtendRequestModel
    {
        public int ManagerId { get; set; }
        public string Reason { get; set; } = string.Empty;
    }

    public class AssignAdditionalMechanicModel
    {
        public int ManagerId { get; set; }
        public int MechanicId { get; set; }
        public string Comment { get; set; } = string.Empty;
    }

    public class CreateRequestModel
    {
        public string CarType { get; set; } = string.Empty;
        public string CarModel { get; set; } = string.Empty;
        public string ProblemDescription { get; set; } = string.Empty;
        public int ClientId { get; set; }
    }

    public class UpdateRequestModel
    {
        public int? MasterId { get; set; }
        public string? Status { get; set; }
    }
}